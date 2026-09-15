import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToBasketButton } from "@/components/cart/add-to-basket-button";
import { WhatsAppIcon } from "@/components/icons";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { JsonLd } from "@/components/site/json-ld";
import { badgeTone, buttonOutline, container } from "@/components/ui/styles";
import { getProductBySlug, getShopProducts } from "@/lib/data/catalog";
import { formatPrice, parseDescription, productMeta } from "@/lib/format";
import { site, whatsappUrl } from "@/lib/site";
import { toCartProduct } from "@/lib/types";

export async function generateStaticParams() {
  const products = await getShopProducts();
  // Cache Components needs at least one param to validate the route at build time.
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "coming-soon" }];
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Baby not found" };
  const { lead } = parseDescription(product.description);
  return {
    title: product.title,
    description: `${lead.slice(0, 140)} · ${formatPrice(product.pricePence)} with free tracked UK delivery.`,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: { images: product.images.slice(0, 1).map((img) => ({ url: img.url, alt: img.alt ?? product.title })) },
  };
}

export default function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/shop/[slug]">, "params">) {
  const { slug } = await params;
  const [product, products] = await Promise.all([getProductBySlug(slug), getShopProducts()]);
  if (!product) notFound();

  const soldOut = product.status === "sold_out" || product.stockQty < 1;
  const { lead, bullets } = parseDescription(product.description);
  const productUrl = `${site.url}/shop/${product.slug}`;
  const related = products
    .filter((p) => p.id !== product.id && p.status === "active" && p.categorySlug === product.categorySlug)
    .slice(0, 4);

  const specs = [
    { label: "Length", value: product.lengthIn ? `Approx. ${product.lengthIn} inches` : null },
    { label: "Weight", value: product.weightLbs ? `Approx. ${product.weightLbs} lbs` : null },
    { label: "Body", value: productMeta({ lengthIn: null, weightLbs: null, categorySlug: product.categorySlug }) || null },
    { label: "Baby", value: product.gender === "unisex" ? null : product.gender === "girl" ? "Girl" : "Boy" },
  ].filter((s) => s.value);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description.slice(0, 5000),
    image: product.images.map((img) => img.url),
    sku: product.id,
    brand: { "@type": "Brand", name: site.name },
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
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "GB",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
      },
    },
  };

  return (
    <div className={`${container} pt-[clamp(20px,3vw,40px)] pb-[clamp(56px,7vw,96px)]`}>
      <JsonLd data={productLd} />
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/" className="hover:text-lilac">Home</Link> /</li>
          <li><Link href="/shop" className="hover:text-lilac">Babies</Link> /</li>
          <li aria-current="page" className="text-cocoa">{product.title}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-[clamp(24px,4vw,56px)] lg:grid-cols-[1.1fr_1fr]">
        <ProductGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-5">
          {product.badge ? (
            <span className={`w-fit rounded-[14px] px-3 py-1.5 text-xs font-bold ${badgeTone(product.badge)}`}>{product.badge}</span>
          ) : null}
          <div>
            <h1 className="font-serif text-[clamp(34px,4.5vw,54px)] leading-[1.05] font-medium text-pretty">{product.title}</h1>
            <p className="mt-2 text-sm text-muted">{productMeta(product)}</p>
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

          <ul className="grid grid-cols-1 gap-2 rounded-[22px] border border-line bg-white p-5 text-sm sm:grid-cols-2">
            <li>✉ Dispatched {site.delivery.dispatch}</li>
            <li>⌂ Tracked UK delivery, {site.delivery.arrives}</li>
            <li>↺ 14-day returns</li>
            <li>♡ Wrapped with love in Bristol</li>
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

      {related.length ? (
        <section aria-labelledby="related-heading" className="mt-[clamp(56px,7vw,96px)]">
          <h2 id="related-heading" className="mb-6 font-serif text-[clamp(28px,3vw,40px)] font-medium">
            You may also love
          </h2>
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

function ProductSkeleton() {
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
