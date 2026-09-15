import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { defaultAnnouncement, defaultSocials } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, Product, Review, SiteSettings, Socials } from "@/lib/types";
import {
  mapCategory,
  mapProduct,
  mapReview,
  PRODUCT_COLUMNS,
  type CategoryRow,
  type ProductRow,
  type ReviewRow,
} from "./mappers";
import { seedCategories, seedProducts, seedReviews } from "./seed";

// Public catalogue data access. Everything here is cached and tagged so the
// admin panel can refresh it instantly with updateTag() after a change.

export async function getShopProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const db = createPublicClient();
  if (!db) return seedProducts;

  const { data, error } = await db
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("status", ["active", "sold_out"])
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const products = await getShopProducts();
  const available = products.filter((p) => p.status === "active");
  const featured = available.filter((p) => p.isFeatured);
  const rest = available.filter((p) => !p.isFeatured);
  return [...featured, ...rest].slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getShopProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("days");
  cacheTag("categories");

  const db = createPublicClient();
  if (!db) return seedCategories;

  const { data, error } = await db
    .from("categories")
    .select("slug, name, description, image_url, tint, sort_order")
    .order("sort_order");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getReviews(limit = 6): Promise<Review[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews");

  const db = createPublicClient();
  if (!db) return seedReviews.slice(0, limit);

  const { data, error } = await db
    .from("reviews")
    .select("id, author_name, rating, body, source, image_url, reviewed_at, is_published")
    .eq("is_published", true)
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load reviews: ${error.message}`);
  return (data as ReviewRow[]).map(mapReview);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag("settings");

  const fallback = { announcement: defaultAnnouncement, socials: defaultSocials };
  const db = createPublicClient();
  if (!db) return fallback;

  const { data, error } = await db.from("site_settings").select("announcement, socials").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  if (!data) return fallback;

  const saved = (data.socials ?? {}) as Partial<Socials>;
  const socials = Object.fromEntries(
    Object.entries(defaultSocials).map(([key, value]) => [key, saved[key as keyof Socials] || value]),
  ) as Socials;
  return { announcement: data.announcement || defaultAnnouncement, socials };
}

export async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
