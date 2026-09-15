import type { MetadataRoute } from "next";
import { getShopProducts } from "@/lib/data/catalog";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getShopProducts();
  const pages = ["", "/shop", "/contact", "/delivery-returns", "/privacy", "/terms", "/cookies"];

  return [
    ...pages.map((path) => ({
      url: `${site.url}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.4,
    })),
    ...products.map((p) => ({
      url: `${site.url}/shop/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.images.slice(0, 3).map((img) => img.url),
    })),
  ];
}
