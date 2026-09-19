import { updateTag } from "next/cache";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { createStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

type Address = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
};

/** Stripe has moved shipping details between versions, so read whichever shape arrives. */
function shippingOf(session: Stripe.Checkout.Session) {
  const s = session as unknown as {
    collected_information?: { shipping_details?: { name?: string | null; address?: Address | null } | null } | null;
    shipping_details?: { name?: string | null; address?: Address | null } | null;
  };
  return s.collected_information?.shipping_details ?? s.shipping_details ?? null;
}

/**
 * The only place an order becomes 'paid'. Every request is checked against the signing
 * secret first, so nothing but Stripe can move money in our records. Stripe retries
 * webhooks, and mark_order_paid ignores an order that is already paid.
 */
export async function POST(request: Request) {
  const stripe = createStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    console.error(
      `[stripe webhook] not configured — STRIPE_SECRET_KEY:${stripe ? "present" : "missing"} STRIPE_WEBHOOK_SECRET:${secret ? "present" : "missing"}`,
    );
    return new Response("not configured", { status: 500 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    console.error("[stripe webhook] signature", (e as Error).message);
    return new Response("bad signature", { status: 400 });
  }

  // A checkout that was never paid for: Stripe has closed it, so the placeholder order
  // can go. Nothing was reserved — stock only moves when an order is paid.
  if (event.type === "checkout.session.expired") {
    const abandonedId = event.data.object.metadata?.order_id;
    const service = createServiceClient();
    if (abandonedId && service) {
      const { error } = await service
        .from("orders")
        .delete()
        .eq("id", abandonedId)
        .eq("status", "pending")
        .eq("channel", "website")
        .is("paid_at", null);
      if (error) console.error("[stripe webhook] discard expired order", error.message);
    }
    return new Response("ok", { status: 200 });
  }

  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return new Response("ignored", { status: 200 });
  }

  const session = event.data.object;
  if (session.payment_status !== "paid") return new Response("not paid", { status: 200 });

  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.error("[stripe webhook] session without order_id", session.id);
    return new Response("no order", { status: 200 });
  }

  const db = createServiceClient();
  if (!db) {
    console.error("[stripe webhook] no service key");
    // 500 so Stripe retries once the key is there.
    return new Response("not configured", { status: 500 });
  }

  const shipping = shippingOf(session);
  const address = shipping?.address ?? null;
  const { data, error } = await db.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_session_id: session.id,
    p_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
    p_name: shipping?.name ?? session.customer_details?.name ?? null,
    p_email: session.customer_details?.email ?? null,
    p_phone: session.customer_details?.phone ?? null,
    p_line1: address?.line1 ?? null,
    p_line2: address?.line2 ?? null,
    p_city: address?.city ?? null,
    p_county: address?.state ?? null,
    p_postcode: address?.postal_code ?? null,
  });

  if (error) {
    console.error("[stripe webhook] mark_order_paid", error.message);
    // 500 makes Stripe retry, which is what we want if the database was briefly unreachable.
    return new Response("could not record payment", { status: 500 });
  }

  if (data === "paid" || data === "paid_without_stock") {
    // Stock changed, so the shop pages need to show it.
    updateTag("products");
  }
  if (data === "paid_without_stock") {
    console.error("[stripe webhook] paid but stock was gone", session.id);
  }

  return new Response("ok", { status: 200 });
}
