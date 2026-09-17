"use client";

import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { buttonOutline, buttonPrimary, card } from "@/components/ui/styles";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/site";
import { DiscountField } from "./discount-field";
import { useCart, useHydrated } from "./use-cart";
import { discountPence, useDiscount } from "./use-discount";

export function CheckoutView({ etsyUrl }: { etsyUrl: string }) {
  const hydrated = useHydrated();
  const { items, subtotalPence } = useCart();
  const { discount } = useDiscount();
  const saving = discountPence(subtotalPence, discount);

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-[22px] bg-white/70" aria-hidden />;
  }

  if (!items.length) {
    return (
      <div className={`${card} px-6 py-16 text-center`}>
        <p className="font-serif text-3xl">Nothing to check out yet ♡</p>
        <Link href="/reborn-dolls" className={`${buttonPrimary} mt-6`}>
          Shop babies
        </Link>
      </div>
    );
  }

  const message = [
    "Hi Dollnest! I'd like to order:",
    ...items.map((i) => `• ${i.title} × ${i.qty} — ${formatPrice(i.pricePence * i.qty)}`),
    ...(saving > 0 ? [`Discount code ${discount?.code}: −${formatPrice(saving)}`] : []),
    `Total: ${formatPrice(subtotalPence - saving)} (free UK delivery)`,
    "",
    "My name:",
    "Delivery postcode:",
  ].join("\n");

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
      <section className={`${card} flex flex-col gap-4 p-[clamp(20px,3vw,32px)]`}>
        <span className="w-fit rounded-full bg-lilac-soft px-3 py-1 text-xs font-bold text-lilac">Secure checkout launching soon</span>
        <h2 className="font-serif text-[32px] leading-tight font-medium">Reserve your baby in one message</h2>
        <p className="leading-relaxed text-muted">
          We&apos;re putting the finishing touches to our secure online checkout. Until then, send us your basket on
          WhatsApp and we&apos;ll reserve your baby and send a secure payment link — or buy through our Etsy shop.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer" className={`${buttonPrimary} bg-whatsapp text-white hover:bg-[#1eb457]`}>
            <WhatsAppIcon className="size-5" />
            Send order on WhatsApp
          </a>
          {etsyUrl ? (
            <a href={etsyUrl} target="_blank" rel="noopener noreferrer" className={buttonOutline}>
              Buy on Etsy
            </a>
          ) : null}
        </div>
      </section>

      <aside className={`${card} flex flex-col gap-3 p-6`} aria-label="Order summary">
        <h2 className="font-serif text-2xl font-medium">Your basket</h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3">
              <span>
                {i.title} <span className="text-muted">× {i.qty}</span>
              </span>
              <span className="font-bold whitespace-nowrap">{formatPrice(i.pricePence * i.qty)}</span>
            </li>
          ))}
        </ul>
        {saving > 0 ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Discount ({discount?.code})</span>
            <span className="font-bold text-sage-deep">−{formatPrice(saving)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-line pt-3">
          <span className="font-bold">Total</span>
          <span className="font-bold text-lilac">{formatPrice(subtotalPence - saving)}</span>
        </div>
        <DiscountField />
        <Link href="/basket" className="text-center text-sm font-bold text-lilac hover:underline">
          ← Edit basket
        </Link>
      </aside>
    </div>
  );
}
