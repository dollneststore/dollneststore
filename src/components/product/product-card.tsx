import Image from "next/image";
import Link from "next/link";
import { AddToBasketButton } from "@/components/cart/add-to-basket-button";
import { badgeTone } from "@/components/ui/styles";
import { formatPrice, productMeta } from "@/lib/format";
import { toCartProduct, type Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  const soldOut = product.status === "sold_out" || product.stockQty < 1;
  const href = `/shop/${product.slug}`;

  return (
    <article className="group flex flex-col gap-2.5 rounded-[22px] border border-line bg-white p-2.5 shadow-[0_6px_24px_rgba(143,107,177,.06)] transition-shadow hover:shadow-[0_14px_34px_rgba(143,107,177,.14)]">
      <Link href={href} className="relative block aspect-square overflow-hidden rounded-2xl bg-blush" tabIndex={-1}>
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.title}
            fill
            sizes="(min-width: 1040px) 280px, (min-width: 560px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted">
            Rehomed
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pb-1">
        <div className="flex-1">
          <h3 className="text-base font-bold leading-snug">
            <Link href={href} className="hover:text-lilac">
              {product.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted">{productMeta(product)}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[17px] font-bold text-lilac">
            {formatPrice(product.pricePence)}
            {product.compareAtPricePence ? (
              <s className="ml-2 text-xs font-semibold text-muted">{formatPrice(product.compareAtPricePence)}</s>
            ) : null}
          </span>
          {product.badge ? (
            <span className={`rounded-[14px] px-2.5 py-[5px] text-[11px] font-bold ${badgeTone(product.badge)}`}>
              {product.badge}
            </span>
          ) : null}
        </div>
        <AddToBasketButton product={toCartProduct(product)} soldOut={soldOut} />
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-[22px] border border-line bg-white p-2.5">
          <div className="aspect-square animate-pulse rounded-2xl bg-blush" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-line" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-line-soft" />
          <div className="mt-4 h-10 animate-pulse rounded-[18px] bg-lilac-soft" />
        </div>
      ))}
    </div>
  );
}
