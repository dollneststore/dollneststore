"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { DISCOUNT_CODE_PATTERN } from "@/lib/admin/validation";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { createStripe } from "@/lib/stripe";
import { createPublicClient } from "@/lib/supabase/public";

export type CheckoutState = { message: string } | null;

const basketSchema = z
  .array(z.object({ product_id: z.uuid(), quantity: z.coerce.number().int().min(1).max(20) }))
  .min(1)
  .max(20);

const codeSchema = z.union([z.literal(""), z.string().trim().toUpperCase().regex(DISCOUNT_CODE_PATTERN)]);
const emailSchema = z.union([z.literal(""), z.email()]);

type OrderDraft = {
  order_id: string;
  order_number: string;
  total_pence: number;
  discount_pence: number;
  discount_code: string | null;
  items: { title: string; unit_price_pence: number; quantity: number; image_url: string | null }[];
};

/** Turns a database error from create_checkout_order into something a shopper can act on. */
function explain(message: string) {
  const [code, name] = message.split(":");
  if (code.includes("stock_short")) return `Sorry — ${name ?? "that baby"} has just been taken. Please remove it from your basket.`;
  if (code.includes("product_unavailable")) return `Sorry — ${name ?? "that baby"} is no longer for sale.`;
  if (code.includes("product_missing")) return "One of the babies in your basket is no longer listed. Please reload the page.";
  if (code.includes("quantity_invalid") || code.includes("basket_invalid")) return "Your basket looks out of date — please reload the page.";
  return "We couldn't start the payment. Please try again, or message us on WhatsApp.";
}

/**
 * Starts a card payment. The basket in the browser only says *which* babies and how many:
 * prices, stock and the discount are all re-read from the database inside
 * create_checkout_order, so an edited basket can't change what is charged.
 */
export async function startCardCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const stripe = createStripe();
  if (!stripe) return { message: "Card payment isn't switched on yet — message us on WhatsApp and we'll take your order." };

  let items: z.infer<typeof basketSchema>;
  let code: string;
  let email: string;
  try {
    items = basketSchema.parse(JSON.parse(String(formData.get("basket") ?? "[]")));
    code = codeSchema.parse(String(formData.get("code") ?? ""));
    email = emailSchema.parse(String(formData.get("email") ?? ""));
  } catch {
    return { message: "Your basket looks out of date — please reload the page." };
  }

  if (!(await allowRequest("checkout", await clientIp(), 30, 60 * 60))) {
    return { message: "Too many attempts from this connection. Please wait a little and try again." };
  }

  const db = createPublicClient();
  if (!db) return { message: "Card payment isn't available right now. Please message us on WhatsApp." };

  const { data, error } = await db.rpc("create_checkout_order", {
    p_items: items,
    p_code: code || null,
    p_email: email || null,
  });
  if (error) {
    console.error("[checkout]", error.message);
    return { message: explain(error.message) };
  }

  const order = data as OrderDraft;
  const lineItems = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "gbp",
      unit_amount: item.unit_price_pence,
      product_data: {
        name: item.title,
        ...(item.image_url ? { images: [item.image_url] } : {}),
      },
    },
  }));

  let session;
  try {
    // The discount rides as a one-off coupon so the line items stay honest and the
    // customer's receipt shows both the price and what came off.
    const discounts = order.discount_pence
      ? [
          {
            coupon: (
              await stripe.coupons.create({
                amount_off: order.discount_pence,
                currency: "gbp",
                duration: "once",
                name: order.discount_code ?? "Discount",
              })
            ).id,
          },
        ]
      : undefined;

    session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "en-GB",
      line_items: lineItems,
      ...(discounts ? { discounts } : {}),
      ...(email ? { customer_email: email } : {}),
      client_reference_id: order.order_number,
      metadata: { order_id: order.order_id, order_number: order.order_number },
      payment_intent_data: {
        description: `Dollnest order ${order.order_number}`,
        // Shows on the customer's statement as DOLLNEST* DN-10001.
        statement_descriptor_suffix: order.order_number,
        metadata: { order_id: order.order_id, order_number: order.order_number },
      },
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["GB"] },
      phone_number_collection: { enabled: true },
      success_url: `${site.url}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site.url}/checkout`,
    });
  } catch (e) {
    console.error("[checkout] stripe", (e as Error).message);
    return { message: "We couldn't reach the payment page. Please try again in a moment." };
  }

  if (!session.url) return { message: "We couldn't reach the payment page. Please try again in a moment." };
  redirect(session.url);
}
