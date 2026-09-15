import Link from "next/link";
import { Markdown } from "@/components/guides/markdown";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { container, eyebrow } from "@/components/ui/styles";
import { getCategories, getShopProducts } from "@/lib/data/catalog";
import { categoryPath, categorySeo, productPath, shopPath } from "@/lib/seo-defaults";
import { site } from "@/lib/site";
import type { Category } from "@/lib/types";
import { CategoryNav } from "./category-nav";
import { ProductCard } from "./product-card";

export async function CategoryView({ category }: { category: Category }) {
  const [products, categories] = await Promise.all([getShopProducts(), getCategories()]);
  const items = products.filter((p) => p.categorySlug === category.slug);
  const seo = categorySeo(category);
  const path = categoryPath(category.slug);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.heading,
    description: seo.description,
    url: `${site.url}${path}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((p, index) => ({
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
          { name: seo.heading, path },
        ]}
      />

      <header className="mb-8 flex max-w-2xl flex-col gap-2">
        <span className={eyebrow}>Collection</span>
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-none font-medium">{seo.heading}</h1>
        <p className="text-[15px] leading-relaxed text-muted">{seo.description}</p>
      </header>

      <div className="mb-7">
        <CategoryNav categories={categories} active={category.slug} />
      </div>

      {items.length ? (
        <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-lilac-line bg-white/70 px-6 py-16 text-center">
          <p className="font-serif text-3xl">New babies arriving soon ♡</p>
          <p className="mt-2 text-muted">Message us on WhatsApp and we&apos;ll let you know when the next one is ready.</p>
          <Link href={shopPath} className="mt-5 inline-block font-bold text-lilac hover:underline">
            See all reborn dolls →
          </Link>
        </div>
      )}

      {seo.intro ? (
        <section aria-label={`About ${seo.heading.toLowerCase()}`} className="mt-[clamp(48px,6vw,80px)] max-w-3xl rounded-[28px] bg-white/70 p-[clamp(20px,3vw,40px)]">
          <Markdown source={seo.intro} />
        </section>
      ) : null}
    </div>
  );
}
