"use client";

import Image from "next/image";
import Link from "next/link";
import { buttonPrimary, card } from "@/components/ui/styles";
import { formatPrice } from "@/lib/format";
import { useCart, useHydrated } from "./use-cart";

export function BasketView() {
  const hydrated = useHydrated();
  const { items, subtotalPence, setQty, remove } = useCart();

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-[22px] bg-white/70" aria-hidden />;
  }

  if (!items.length) {
    return (
      <div className={`${card} px-6 py-16 text-center`}>
        <p className="font-serif text-3xl">Your basket is empty ♡</p>
        <p className="mt-2 text-muted">Every baby is waiting for a loving home.</p>
        <Link href="/reborn-dolls" className={`${buttonPrimary} mt-6`}>
          Shop babies
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.productId} className={`${card} flex gap-4 p-3`}>
            <Link href={`/reborn-dolls/${item.slug}`} className="relative size-24 flex-none overflow-hidden rounded-2xl bg-blush sm:size-28">
              {item.image ? <Image src={item.image} alt="" fill sizes="112px" className="object-cover" /> : null}
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-2">
              <div className="flex justify-between gap-3">
                <Link href={`/reborn-dolls/${item.slug}`} className="font-bold leading-snug hover:text-lilac">
                  {item.title}
                </Link>
                <span className="font-bold whitespace-nowrap text-lilac">{formatPrice(item.pricePence * item.qty)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center rounded-full border border-line" role="group" aria-label={`Quantity for ${item.title}`}>
                  <button
                    type="button"
                    onClick={() => setQty(item.productId, item.qty - 1)}
                    className="grid size-9 place-items-center rounded-full text-lg hover:bg-blush"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold" aria-live="polite">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(item.productId, item.qty + 1)}
                    disabled={item.qty >= item.maxQty}
                    className="grid size-9 place-items-center rounded-full text-lg hover:bg-blush disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button type="button" onClick={() => remove(item.productId)} className="text-xs font-bold text-muted hover:text-rose">
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className={`${card} sticky top-24 flex flex-col gap-3 p-6`} aria-label="Order summary">
        <h2 className="font-serif text-2xl font-medium">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-bold">{formatPrice(subtotalPence)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Tracked UK delivery</dt>
            <dd className="font-bold text-sage-deep">Free</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-bold text-lilac">{formatPrice(subtotalPence)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className={`${buttonPrimary} mt-2 w-full`}>
          Continue to checkout
        </Link>
        <p className="text-center text-xs text-muted">Delivery to UK addresses only · 14-day returns</p>
      </aside>
    </div>
  );
}
