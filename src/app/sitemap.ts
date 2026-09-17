import type { MetadataRoute } from "next";
import { getCategories, getGuides, getShopProducts } from "@/lib/data/catalog";
import { categoryPath, guidePath, productPath, reviewsPath, shopPath } from "@/lib/seo-defaults";
import { site } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, guides] = await Promise.all([getShopProducts(), getCategories(), getGuides()]);
  const url = (path: string) => `${site.url}${path === "/" ? "" : path}`;

  const staticPages: Entry[] = [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url(shopPath), changeFrequency: "daily", priority: 0.9 },
    { url: url(reviewsPath), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/guides"), changeFrequency: "weekly", priority: 0.6 },
    { url: url("/contact"), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/delivery-returns"), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/cookies"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const collectionPages: Entry[] = categories.map((c) => ({
    url: url(categoryPath(c.slug)),
    changeFrequency: "daily",
    priority: 0.85,
    ...(c.imageUrl ? { images: [c.imageUrl] } : {}),
  }));

  const productPages: Entry[] = products.map((p) => ({
    url: url(productPath(p.slug)),
    ...(p.updatedAt ? { lastModified: p.updatedAt } : {}),
    changeFrequency: "weekly",
    priority: p.status === "active" ? 0.8 : 0.5,
    images: p.images.slice(0, 5).map((img) => img.url),
  }));

  const guidePages: Entry[] = guides.map((g) => ({
    url: url(guidePath(g.slug)),
    ...(g.updatedAt || g.publishedAt ? { lastModified: (g.updatedAt ?? g.publishedAt) as string } : {}),
    changeFrequency: "monthly",
    priority: 0.6,
    ...(g.coverImageUrl ? { images: [g.coverImageUrl] } : {}),
  }));

  return [...staticPages, ...collectionPages, ...productPages, ...guidePages];
}
