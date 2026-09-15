import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "@/components/icons";
import { CategoryNav } from "@/components/product/category-nav";
import { ProductCard, ProductGridSkeleton } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { container, eyebrow, tintBg } from "@/components/ui/styles";
import { getCategories, getShopProducts } from "@/lib/data/catalog";
import { staticPageMetadata } from "@/lib/seo";
import { categoryDefaults, categoryPath, productPath, shopPath } from "@/lib/seo-defaults";
import { site } from "@/lib/site";
import type { Product } from "@/lib/types";

const PER_PAGE = 24;

export function generateMetadata() {
  return staticPageMetadata("/reborn-dolls");
}

export default async function RebornDollsPage({ searchParams }: PageProps<"/reborn-dolls">) {
  const [products, categories] = await Promise.all([getShopProducts(), getCategories()]);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Reborn dolls for sale",
    url: `${site.url}${shopPath}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${site.url}${productPath(p.slug)}`,
        name: p.title,
      })),
    },
  };

  return (
    <div className={`${container} pt-[clamp(20px,3vw,40px)] pb-[clamp(56px,7vw,96px)]`}>
      <JsonLd data={collectionLd} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Reborn dolls", path: shopPath },
        ]}
      />
      <header className="mb-8 flex max-w-2xl flex-col gap-2">
        <span className={eyebrow}>The nursery</span>
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-none font-medium">Reborn dolls for sale</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Every baby is one of a kind: full silicone, weighted and cloth-body reborns, dressed in a brand-new outfit and
          posted free with tracking across the UK.
        </p>
      </header>

      <div className="mb-6">
        <CategoryNav categories={categories} />
      </div>

      <Suspense fallback={<ProductGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>

      <section aria-labelledby="collections-heading" className="mt-[clamp(56px,7vw,96px)]">
        <h2 id="collections-heading" className="mb-5 font-serif text-[clamp(28px,3vw,40px)] font-medium">
          Shop by collection
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const content = categoryDefaults(c);
            return (
              <li key={c.slug}>
                <Link
                  href={categoryPath(c.slug)}
                  className={`flex h-full flex-col gap-2 rounded-[22px] p-5 transition-transform hover:-translate-y-0.5 ${tintBg[c.tint]}`}
                >
                  <span className="font-serif text-2xl font-semibold">{content.heading}</span>
                  <span className="text-[13px] leading-relaxed text-[#6b5a60]">{c.seoDescription || content.description}</span>
                  <span className="mt-auto text-sm font-bold text-lilac">Explore →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

const sortOptions = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "size-asc": "Size: small to large",
  "size-desc": "Size: large to small",
} as const;

const sizeBands: Record<string, { label: string; match: (p: Product) => boolean }> = {
  small: { label: "Up to 13 inch", match: (p) => (p.lengthIn ?? 0) > 0 && (p.lengthIn ?? 0) <= 13 },
  medium: { label: "14–18 inch", match: (p) => (p.lengthIn ?? 0) >= 14 && (p.lengthIn ?? 0) <= 18 },
  large: { label: "19 inch and over", match: (p) => (p.lengthIn ?? 0) >= 19 },
};

const priceBands: Record<string, { label: string; match: (p: Product) => boolean }> = {
  "under-100": { label: "Under £100", match: (p) => p.pricePence < 10000 },
  "100-200": { label: "£100 – £200", match: (p) => p.pricePence >= 10000 && p.pricePence <= 20000 },
  "over-200": { label: "Over £200", match: (p) => p.pricePence > 20000 },
};

const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

async function Results({ searchParams }: Pick<PageProps<"/reborn-dolls">, "searchParams">) {
  const sp = await searchParams;
  const query = param(sp.q).trim().slice(0, 60);
  const gender = param(sp.gender);
  const size = param(sp.size);
  const price = param(sp.price);
  const sort = (param(sp.sort) || "featured") as keyof typeof sortOptions;
  const page = Math.max(1, Number.parseInt(param(sp.page), 10) || 1);

  const products = await getShopProducts();
  const needle = query.toLowerCase();
  let results = products.filter(
    (p) =>
      (!needle || `${p.title} ${p.description}`.toLowerCase().includes(needle)) &&
      (!gender || p.gender === gender) &&
      (!size || sizeBands[size]?.match(p)) &&
      (!price || priceBands[price]?.match(p)),
  );

  if (sort === "price-asc") results = [...results].sort((a, b) => a.pricePence - b.pricePence);
  else if (sort === "price-desc") results = [...results].sort((a, b) => b.pricePence - a.pricePence);
  else if (sort === "size-asc") results = [...results].sort((a, b) => (a.lengthIn ?? 99) - (b.lengthIn ?? 99));
  else if (sort === "size-desc") results = [...results].sort((a, b) => (b.lengthIn ?? 0) - (a.lengthIn ?? 0));

  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const shown = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const filtersUsed = Boolean(query || gender || size || price || sort !== "featured");

  const pageHref = (next: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (gender) params.set("gender", gender);
    if (size) params.set("size", size);
    if (price) params.set("price", price);
    if (sort !== "featured") params.set("sort", sort);
    if (next > 1) params.set("page", String(next));
    const search = params.toString();
    return search ? `${shopPath}?${search}` : shopPath;
  };

  const selectClass =
    "rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold outline-none focus:border-lilac";

  return (
    <>
      <Form action={shopPath} className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-white py-1 pr-1 pl-4">
          <label htmlFor="shop-search" className="sr-only">
            Search reborn dolls
          </label>
          <input
            id="shop-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search reborn dolls…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="grid size-9 place-items-center rounded-full bg-lilac-soft text-cocoa hover:bg-lilac hover:text-white"
          >
            <SearchIcon width={16} height={16} />
          </button>
        </div>
        <select name="gender" defaultValue={gender} aria-label="Baby" className={selectClass}>
          <option value="">Girl or boy</option>
          <option value="girl">Girl</option>
          <option value="boy">Boy</option>
        </select>
        <select name="size" defaultValue={size} aria-label="Size" className={selectClass}>
          <option value="">Any size</option>
          {Object.entries(sizeBands).map(([value, band]) => (
            <option key={value} value={value}>
              {band.label}
            </option>
          ))}
        </select>
        <select name="price" defaultValue={price} aria-label="Price" className={selectClass}>
          <option value="">Any price</option>
          {Object.entries(priceBands).map(([value, band]) => (
            <option key={value} value={value}>
              {band.label}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label="Sort by" className={selectClass}>
          {Object.entries(sortOptions).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-lilac px-4 py-2 text-sm font-bold text-white hover:bg-[#7a5a9b]">
          Apply
        </button>
        {filtersUsed ? (
          <Link href={shopPath} className="px-2 text-sm font-bold text-muted hover:text-rose">
            Clear
          </Link>
        ) : null}
      </Form>

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {results.length} {results.length === 1 ? "item" : "items"}
        {query ? ` for “${query}”` : ""}
        {pageCount > 1 ? ` · page ${current} of ${pageCount}` : ""}
      </p>

      {shown.length ? (
        <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2 lg:grid-cols-4">
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-lilac-line bg-white/70 px-6 py-16 text-center">
          <p className="font-serif text-3xl">No babies found ♡</p>
          <p className="mt-2 text-muted">New babies arrive every week — try another filter or message us on WhatsApp.</p>
          <Link href={shopPath} className="mt-5 inline-block font-bold text-lilac hover:underline">
            See all reborn dolls →
          </Link>
        </div>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {current > 1 ? (
            <Link href={pageHref(current - 1)} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold hover:border-lilac">
              ← Previous
            </Link>
          ) : null}
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((number) => (
            <Link
              key={number}
              href={pageHref(number)}
              aria-current={number === current ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                number === current ? "bg-lilac text-white" : "border border-line bg-white hover:border-lilac"
              }`}
            >
              {number}
            </Link>
          ))}
          {current < pageCount ? (
            <Link href={pageHref(current + 1)} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold hover:border-lilac">
              Next →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
