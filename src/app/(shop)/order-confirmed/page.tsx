import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClearBasket } from "@/components/cart/clear-basket";
import { WhatsAppIcon } from "@/components/icons";
import { buttonOutline, buttonPrimary, card, container } from "@/components/ui/styles";
import { formatPrice } from "@/lib/format";
import { site, whatsappUrl } from "@/lib/site";
import { createStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default function OrderConfirmedPage({ searchParams }: PageProps<"/order-confirmed">) {
  return (
    <div className={`${container} pt-[clamp(28px,4vw,56px)] pb-[clamp(56px,7vw,96px)]`}>
      <Suspense fallback={<div className={`${card} h-64 animate-pulse`} aria-hidden />}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Confirmation({ searchParams }: Pick<PageProps<"/order-confirmed">, "searchParams">) {
  const { session_id: sessionId } = await searchParams;
  const stripe = createStripe();
  const id = typeof sessionId === "string" && sessionId.startsWith("cs_") ? sessionId : "";
  const session = stripe && id ? await stripe.checkout.sessions.retrieve(id).catch(() => null) : null;
  const paid = session?.payment_status === "paid";
  const orderNumber = session?.metadata?.order_number ?? session?.client_reference_id ?? null;

  if (!paid) {
    return (
      <div className={`${card} mx-auto max-w-xl px-6 py-14 text-center`}>
        <h1 className="font-serif text-[clamp(30px,4vw,44px)] leading-tight font-medium">We couldn&apos;t confirm that payment</h1>
        <p className="mt-3 leading-relaxed text-muted">
          If money has left your account it will either complete shortly or be returned automatically. Message us and
          we&apos;ll check it for you straight away.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={whatsappUrl("Hi Dollnest, I'd like to check a payment.")} target="_blank" rel="noopener noreferrer" className={`${buttonPrimary} bg-whatsapp text-white hover:bg-[#1eb457]`}>
            <WhatsAppIcon className="size-5" />
            Message us
          </a>
          <Link href="/basket" className={buttonOutline}>
            Back to your basket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${card} mx-auto max-w-xl px-6 py-14 text-center`}>
      <ClearBasket />
      <p className="text-xs font-bold uppercase tracking-[.16em] text-lilac">Payment received</p>
      <h1 className="mt-2 font-serif text-[clamp(32px,4.5vw,48px)] leading-tight font-medium">Thank you ♡</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Your baby is reserved and we&apos;ll start getting them ready. We dispatch {site.delivery.dispatch}, and you&apos;ll
        get a tracking number by email as soon as they&apos;re on the way.
      </p>

      <dl className="mx-auto mt-6 w-fit space-y-2 text-left text-sm">
        {orderNumber ? (
          <div className="flex gap-4">
            <dt className="text-muted">Order</dt>
            <dd className="font-bold">{orderNumber}</dd>
          </div>
        ) : null}
        <div className="flex gap-4">
          <dt className="text-muted">Paid</dt>
          <dd className="font-bold">{formatPrice(session.amount_total ?? 0)}</dd>
        </div>
        {session.customer_details?.email ? (
          <div className="flex gap-4">
            <dt className="text-muted">Receipt to</dt>
            <dd className="font-bold">{session.customer_details.email}</dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Price includes VAT. You can cancel within 14 days of delivery — see our delivery &amp; returns page.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/reborn-dolls" className={buttonPrimary}>
          Meet the other babies ♡
        </Link>
        <Link href="/delivery-returns" className={buttonOutline}>
          Delivery &amp; returns
        </Link>
      </div>
    </div>
  );
}
