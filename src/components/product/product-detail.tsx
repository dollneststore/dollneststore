import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToBasketButton } from "@/components/cart/add-to-basket-button";
import { Stars } from "@/components/home/home-sections";
import { WhatsAppIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { badgeTone, buttonOutline, container } from "@/components/ui/styles";
import { getCategories, getProductBySlug, getProductReviewStats, getShopProducts, getSiteSettings } from "@/lib/data/catalog";
import { formatDate, formatPrice, parseDescription, productMeta } from "@/lib/format";
import { categoryDefaults, categoryPath, productPath, shopPath } from "@/lib/seo-defaults";
import { site, whatsappUrl } from "@/lib/site";
import { toCartProduct } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductGallery } from "./product-gallery";

export async function ProductDetail({ slug }: { slug: string }) {
  const [product, products, categories, reviewStats, settings] = await Promise.all([
    getProductBySlug(slug),
    getShopProducts(),
    getCategories(),
    getProductReviewStats(),
    getSiteSettings(),
  ]);
  if (!product) notFound();

  const category = categories.find((c) => c.slug === product.categorySlug);
  const categoryHeading = category ? categoryDefaults(category).heading : null;
  const stats = reviewStats[product.id];
  const soldOut = product.status === "sold_out" || product.stockQty < 1;
  const { lead, bullets } = parseDescription(product.description);
  const productUrl = `${site.url}${productPath(product.slug)}`;
  const related = products
    .filter((p) => p.id !== product.id && p.status === "active" && p.categorySlug === product.categorySlug)
    .slice(0, 4);

  const specs = [
    { label: "Length", value: product.lengthIn ? `Approx. ${product.lengthIn} inches` : null },
    { label: "Weight", value: product.weightLbs ? `Approx. ${product.weightLbs} lbs` : null },
    { label: "Body", value: productMeta({ lengthIn: null, weightLbs: null, categorySlug: product.categorySlug }) || null },
    { label: "Baby", value: product.gender === "unisex" ? null : product.gender === "girl" ? "Girl" : "Boy" },
  ].filter((s) => s.value);

  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Reborn dolls", path: shopPath },
    ...(category && categoryHeading ? [{ name: categoryHeading, path: categoryPath(category.slug) }] : []),
    { name: product.title, path: productPath(product.slug) },
  ];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description.slice(0, 5000),
    image: product.images.map((img) => img.url),
    sku: product.id,
    brand: { "@type": "Brand", name: site.name },
    ...(categoryHeading ? { category: categoryHeading } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "GBP",
      price: (product.pricePence / 100).toFixed(2),
      availability: soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: site.company.legalName },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "GBP" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "GB" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 3, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "GB",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
    ...(stats
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: stats.average.toFixed(1),
            reviewCount: stats.count,
            bestRating: 5,
          },
          review: stats.reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            author: { "@type": "Person", name: r.authorName },
            reviewBody: r.body,
            ...(r.reviewedAt ? { datePublished: r.reviewedAt } : {}),
          })),
        }
      : {}),
  };

  return (
    <div className={`${container} pt-[clamp(20px,3vw,40px)] pb-[clamp(56px,7vw,96px)]`}>
      <JsonLd data={productLd} />
      <Breadcrumbs items={breadcrumbs} />

      <div className="grid grid-cols-1 gap-[clamp(24px,4vw,56px)] lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-3">
          <ProductGallery images={product.images} title={product.title} />
          <p className="text-xs leading-relaxed text-muted">
            <span aria-hidden>◉</span> Real photos of this exact baby — we never use stock images.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {product.badge ? (
              <span className={`w-fit rounded-[14px] px-3 py-1.5 text-xs font-bold ${badgeTone(product.badge)}`}>{product.badge}</span>
            ) : null}
            {category && categoryHeading ? (
              <Link href={categoryPath(category.slug)} className="text-xs font-bold text-lilac hover:underline">
                {categoryHeading}
              </Link>
            ) : null}
          </div>
          <div>
            <h1 className="font-serif text-[clamp(34px,4.5vw,54px)] leading-[1.05] font-medium text-pretty">{product.title}</h1>
            <p className="mt-2 text-sm text-muted">{productMeta(product)}</p>
            {stats ? (
              <a href="#product-reviews" className="mt-2 flex items-center gap-2 text-sm text-muted hover:text-lilac">
                <Stars rating={stats.average} />
                {stats.average.toFixed(1)} · {stats.count} {stats.count === 1 ? "review" : "reviews"}
              </a>
            ) : null}
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-lilac">{formatPrice(product.pricePence)}</span>
            {product.compareAtPricePence ? (
              <s className="text-base font-semibold text-muted">{formatPrice(product.compareAtPricePence)}</s>
            ) : null}
            <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-sage-deep">Free UK delivery</span>
          </div>

          <AddToBasketButton product={toCartProduct(product)} soldOut={soldOut} size="lg" />
          <a
            href={whatsappUrl(`Hi Dollnest! I'd love to know more about "${product.title}" ♡ ${productUrl}`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonOutline}
          >
            <WhatsAppIcon className="size-5 text-whatsapp" />
            Ask about this baby on WhatsApp
          </a>
          {settings.socials.tiktok ? (
            <a
              href={settings.socials.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-sm font-bold text-lilac hover:underline"
            >
              <span aria-hidden>♪</span> See our babies in motion on TikTok
            </a>
          ) : null}

          <ul className="grid grid-cols-1 gap-2 rounded-[22px] border border-line bg-white p-5 text-sm sm:grid-cols-2">
            <li>✉ Dispatched {site.delivery.dispatch}</li>
            <li>⌂ Tracked UK delivery, {site.delivery.arrives}</li>
            <li>↺ 14-day returns</li>
            <li>♡ Wrapped with love in Bristol</li>
            <li>◉ Real photos — no stock images</li>
          </ul>

          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="font-serif text-[28px] font-medium">About this baby</h2>
            {lead ? <p className="mt-2 leading-relaxed text-[#6b5a60]">{lead}</p> : null}
            {bullets.length ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-[#6b5a60]">
                {bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>

          {specs.length ? (
            <dl className="grid grid-cols-2 gap-3">
              {specs.map((s) => (
                <div key={s.label} className="rounded-2xl bg-lilac-soft/60 px-4 py-3">
                  <dt className="text-[11px] font-bold uppercase tracking-[.14em] text-lilac">{s.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold first-letter:uppercase">{s.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <p className="text-xs leading-relaxed text-muted">
            Not suitable for children under 3 years. Outfits are brand new and similar to those pictured.
            {product.etsyListingId ? (
              <>
                {" "}Also listed on{" "}
                <a
                  href={`https://www.etsy.com/uk/listing/${product.etsyListingId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-lilac underline"
                >
                  our Etsy shop
                </a>
                .
              </>
            ) : null}
          </p>
        </div>
      </div>

      {stats ? (
        <section id="product-reviews" aria-labelledby="reviews-heading" className="mt-[clamp(48px,6vw,80px)] scroll-mt-24">
          <h2 id="reviews-heading" className="mb-5 font-serif text-[clamp(28px,3vw,40px)] font-medium">
            What families say
          </h2>
          <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {stats.reviews.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-[22px]">
                <Stars rating={r.rating} />
                {r.imageUrl ? (
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-blush">
                    <Image src={r.imageUrl} alt={`Photo of their Dollnest baby shared by ${r.authorName}`} fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover" />
                  </div>
                ) : null}
                <p className="font-serif text-[19px] leading-snug">“{r.body}”</p>
                <p className="mt-auto text-xs text-muted">
                  <b className="text-cocoa">{r.authorName}</b>
                  {r.reviewedAt ? ` · ${formatDate(r.reviewedAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section aria-labelledby="related-heading" className="mt-[clamp(56px,7vw,96px)]">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="related-heading" className="font-serif text-[clamp(28px,3vw,40px)] font-medium">
              You may also love
            </h2>
            {category && categoryHeading ? (
              <Link href={categoryPath(category.slug)} className="text-sm font-bold text-lilac hover:underline">
                All {categoryHeading.toLowerCase()} →
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className={`${container} py-10`} aria-hidden>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="aspect-square animate-pulse rounded-[28px] bg-blush" />
        <div className="space-y-4">
          <div className="h-12 w-3/4 animate-pulse rounded-xl bg-line" />
          <div className="h-8 w-1/3 animate-pulse rounded-xl bg-lilac-soft" />
          <div className="h-14 animate-pulse rounded-full bg-rose-soft" />
          <div className="h-40 animate-pulse rounded-[22px] bg-white" />
        </div>
      </div>
    </div>
  );
}
