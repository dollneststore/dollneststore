import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryView } from "@/components/product/category-view";
import { ProductDetail, ProductSkeleton } from "@/components/product/product-detail";
import { getCategories, getProductBySlug, getShopProducts } from "@/lib/data/catalog";
import { buildMetadata } from "@/lib/seo";
import { categoryPath, categorySeo, productPath, productSeo } from "@/lib/seo-defaults";

// One segment serves both collections (/reborn-dolls/silicone) and products
// (/reborn-dolls/silicone-baby-girl-5835). The admin prevents slug clashes.

export async function generateStaticParams() {
  const [categories, products] = await Promise.all([getCategories(), getShopProducts()]);
  const params = [...categories.map((c) => ({ slug: c.slug })), ...products.map((p) => ({ slug: p.slug }))];
  // Cache Components needs at least one param to validate the route at build time.
  return params.length ? params : [{ slug: "coming-soon" }];
}

export async function generateMetadata({ params }: PageProps<"/reborn-dolls/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (category) {
    const seo = categorySeo(category);
    return buildMetadata({ title: seo.title, description: seo.description, path: categoryPath(slug), image: category.imageUrl });
  }

  const product = await getProductBySlug(slug);
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
