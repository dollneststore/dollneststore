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

      <div className="mb-7">
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

async function Results({ searchParams }: Pick<PageProps<"/reborn-dolls">, "searchParams">) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const products = await getShopProducts();
  const needle = query.toLowerCase();
  const results = needle ? products.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(needle)) : products;

  return (
    <>
      <Form action={shopPath} role="search" className="mb-6 flex w-full items-center gap-2 rounded-full border border-line bg-white py-1 pr-1 pl-4 sm:w-96">
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
      </Form>

      {query ? (
        <p className="mb-4 text-sm text-muted" aria-live="polite">
          {results.length} {results.length === 1 ? "baby" : "babies"} found for “{query}” ·{" "}
          <Link href={shopPath} className="font-bold text-lilac hover:underline">
            Clear search
          </Link>
        </p>
      ) : null}

      {results.length ? (
        <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2 lg:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-lilac-line bg-white/70 px-6 py-16 text-center">
          <p className="font-serif text-3xl">No babies found ♡</p>
          <p className="mt-2 text-muted">New babies arrive every week — try another search or message us on WhatsApp.</p>
        </div>
      )}
    </>
  );
}
