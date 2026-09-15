import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "@/components/icons";
import { ProductCard, ProductGridSkeleton } from "@/components/product/product-card";
import { container, eyebrow } from "@/components/ui/styles";
import { getCategories, getShopProducts } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Shop reborn babies",
  description:
    "Browse full silicone, weighted and cloth-body reborn baby dolls. Free tracked UK delivery, dispatched within 48 hours.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className={`${container} pt-[clamp(28px,4vw,56px)] pb-[clamp(56px,7vw,96px)]`}>
      <header className="mb-8 flex flex-col gap-2">
        <span className={eyebrow}>The nursery</span>
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-none font-medium">All babies</h1>
        <p className="max-w-xl text-[15px] text-muted">
          Every baby is one of a kind, dressed in a brand-new outfit and posted free with tracking across the UK.
        </p>
      </header>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ShopResults({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  const [products, categories] = await Promise.all([getShopProducts(), getCategories()]);

  const needle = query.toLowerCase();
  const results = products.filter(
    (p) =>
      (!category || p.categorySlug === category) &&
      (!needle || `${p.title} ${p.description}`.toLowerCase().includes(needle)),
  );

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold transition-colors ${
      active ? "bg-lilac text-white" : "border border-line bg-white hover:border-lilac hover:text-lilac"
    }`;

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Collections" className="flex flex-wrap gap-2">
          <Link href={query ? `/shop?q=${encodeURIComponent(query)}` : "/shop"} className={chip(!category)}>
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={chip(category === c.slug)}
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <Form action="/shop" role="search" className="flex w-full items-center gap-2 rounded-full border border-line bg-white py-1 pr-1 pl-4 lg:w-80">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <label htmlFor="shop-search" className="sr-only">
            Search babies
          </label>
          <input
            id="shop-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search babies…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button type="submit" aria-label="Search" className="grid size-9 place-items-center rounded-full bg-lilac-soft text-cocoa hover:bg-lilac hover:text-white">
            <SearchIcon width={16} height={16} />
          </button>
        </Form>
      </div>

      {results.length ? (
        <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2 lg:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-lilac-line bg-white/70 px-6 py-16 text-center">
          <p className="font-serif text-3xl">No babies here just yet ♡</p>
          <p className="mt-2 text-muted">New babies arrive every week — try another collection or message us on WhatsApp.</p>
          <Link href="/shop" className="mt-5 inline-block font-bold text-lilac hover:underline">
            See all babies →
          </Link>
        </div>
      )}
    </>
  );
}
