import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { defaultAnnouncement, defaultSocials } from "@/lib/site";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, Guide, PageSeo, Product, ProductReviewStats, Review, SiteSettings, Socials } from "@/lib/types";
import {
  CATEGORY_COLUMNS,
  GUIDE_COLUMNS,
  mapCategory,
  mapGuide,
  mapPageSeo,
  mapProduct,
  mapReview,
  PRODUCT_COLUMNS,
  REVIEW_COLUMNS,
  type CategoryRow,
  type GuideRow,
  type PageSeoRow,
  type ProductRow,
  type ReviewRow,
} from "./mappers";
import { seedCategories, seedProducts, seedReviews } from "./seed";

// Public data access. Everything here is cached and tagged so the admin panel
// can refresh it instantly with updateTag() after a change.

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

  const { data, error } = await db.from("categories").select(CATEGORY_COLUMNS).order("sort_order");
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
    .select(REVIEW_COLUMNS)
    .eq("is_published", true)
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load reviews: ${error.message}`);
  return (data as ReviewRow[]).map(mapReview);
}

/** Published reviews linked to a product, grouped by product id (for product pages and rich results). */
export async function getProductReviewStats(): Promise<Record<string, ProductReviewStats>> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews");

  const db = createPublicClient();
  if (!db) return {};

  const { data, error } = await db
    .from("reviews")
    .select(`${REVIEW_COLUMNS}, product_id`)
    .eq("is_published", true)
    .not("product_id", "is", null)
    .order("reviewed_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`Could not load product reviews: ${error.message}`);

  const stats: Record<string, ProductReviewStats> = {};
  for (const row of data as (ReviewRow & { product_id: string })[]) {
    const entry = (stats[row.product_id] ??= { count: 0, average: 0, reviews: [] });
    entry.reviews.push(mapReview(row));
    entry.count += 1;
  }
  for (const entry of Object.values(stats)) {
    entry.average = entry.reviews.reduce((sum, r) => sum + r.rating, 0) / entry.count;
  }
  return stats;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag("settings");

  const fallback: SiteSettings = { announcement: defaultAnnouncement, socials: defaultSocials, googleSiteVerification: null };
  const db = createPublicClient();
  if (!db) return fallback;

  const { data, error } = await db
    .from("site_settings")
    .select("announcement, socials, google_site_verification")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  if (!data) return fallback;

  const saved = (data.socials ?? {}) as Partial<Socials>;
  const socials = Object.fromEntries(
    Object.entries(defaultSocials).map(([key, value]) => [key, saved[key as keyof Socials] || value]),
  ) as Socials;
  return {
    announcement: data.announcement || defaultAnnouncement,
    socials,
    googleSiteVerification: data.google_site_verification ?? null,
  };
}

async function getPageSeoMap(): Promise<Record<string, PageSeo>> {
  "use cache";
  cacheLife("days");
  cacheTag("seo");

  const db = createPublicClient();
  if (!db) return {};

  const { data, error } = await db.from("page_seo").select("path, title, description, og_image_url");
  if (error) throw new Error(`Could not load page SEO: ${error.message}`);
  return Object.fromEntries((data as PageSeoRow[]).map((row) => [row.path, mapPageSeo(row)]));
}

export async function getPageSeo(path: string): Promise<PageSeo | null> {
  const map = await getPageSeoMap();
  return map[path] ?? null;
}

export async function getGuides(): Promise<Guide[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("guides");

  const db = createPublicClient();
  if (!db) return [];

  const { data, error } = await db
    .from("posts")
    .select(GUIDE_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw new Error(`Could not load guides: ${error.message}`);
  return (data as GuideRow[]).map(mapGuide);
}

export async function getGuideBySlug(slug: string): Promise<Guide | null> {
  const guides = await getGuides();
  return guides.find((g) => g.slug === slug) ?? null;
}

export async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
