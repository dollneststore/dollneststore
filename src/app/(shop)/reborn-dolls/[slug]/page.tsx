import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryView } from "@/components/product/category-view";
import { ProductDetail, ProductSkeleton } from "@/components/product/product-detail";
import { getCategories, getCategoriesWithCovers, getProductBySlug, getShopProducts } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";
import { categoryPath, categorySeo, productPath, productSeo } from "@/lib/seo-defaults";

// One segment serves both collections (/reborn-dolls/silicone) and products
// (/reborn-dolls/silicone-baby-girl-5835). The admin prevents slug clashes.

export async function generateStaticParams() {
  const [categories, products] = await Promise.all([getCategories(), getShopProducts()]);
  const params = [...categories.map((c) => ({ slug: c.slug })), ...products.map((p) => ({ slug: p.slug }))];
  // Cache Components requires at least one param; an empty catalogue would otherwise fail the
  // build. The placeholder is answered with a real 404 by generateMetadata below.
  return params.length ? params : [{ slug: "coming-soon" }];
}

export async function generateMetadata({ params }: PageProps<"/reborn-dolls/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // Covers fall back to a product photo, so a collection without its own cover still gets
  // a social sharing image.
  const category = (await getCategoriesWithCovers()).find((c) => c.slug === slug);
  if (category) {
    const seo = categorySeo(category);
    return buildMetadata({ title: seo.title, description: seo.description, path: categoryPath(slug), image: category.imageUrl });
  }

  const product = await getProductBySlug(slug);
  // An unknown slug renders the 404 page, but with a 200 status: with Cache Components every
  // dynamic route streams its shell first, and the status can't change once streaming started.
  // Next handles this with the noindex tag below, which keeps the URL out of search results.
  // A real 404 status would mean checking the slug in proxy.ts on every request.
  if (!product) return { title: "Baby not found", robots: { index: false } };
  const seo = productSeo(product);
  return buildMetadata({
    title: seo.title,
    description: seo.description,
    path: productPath(product.slug),
    image: product.images[0]?.url,
  });
}

export default function RebornDollPage({ params }: PageProps<"/reborn-dolls/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <SlugView params={params} />
    </Suspense>
  );
}

async function SlugView({ params }: Pick<PageProps<"/reborn-dolls/[slug]">, "params">) {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  return category ? <CategoryView category={category} /> : <ProductDetail slug={slug} />;
}
