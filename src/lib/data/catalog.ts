import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isAccessoryProduct } from "@/lib/seo-defaults";
import { defaultAnnouncement, defaultPopup, defaultSocials } from "@/lib/site";
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

/**
 * Seed data is a local convenience so the site can be run without Supabase. On the deployed
 * site it must never appear: quietly serving seed products would show customers prices and
 * stock for dolls that don't exist, so a missing configuration fails loudly there instead.
 */
function publicDb() {
  const db = createPublicClient();
  if (!db && process.env.VERCEL === "1") {
    throw new Error("Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
  }
  return db;
}

export async function getShopProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const db = publicDb();
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

export const isForSale = (p: Product) => p.status === "active" && p.stockQty > 0;

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const products = await getShopProducts();
  // The home page features babies, never accessories.
  const available = products.filter((p) => isForSale(p) && !isAccessoryProduct(p));
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

  const db = publicDb();
  if (!db) return seedCategories;

  const { data, error } = await db.from("categories").select(CATEGORY_COLUMNS).order("sort_order");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return (data as CategoryRow[]).map(mapCategory);
}

/**
 * Collections are shown with a cover photo. When one hasn't been set in the admin panel
 * (the accessories collection was added without one), we borrow the first photo from a
 * product in that collection, so a collection card is never an empty box.
 */
export async function getCategoriesWithCovers(): Promise<Category[]> {
  const [categories, products] = await Promise.all([getCategories(), getShopProducts()]);
  return categories.map((category) => {
    if (category.imageUrl) return category;
    const withPhotos = products.filter((p) => p.categorySlug === category.slug && p.images.length > 0);
    const cover = (withPhotos.find(isForSale) ?? withPhotos[0])?.images[0];
    return cover ? { ...category, imageUrl: cover.url } : category;
  });
}

export async function getReviews(limit = 6): Promise<Review[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("reviews");

  const db = publicDb();
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

  const db = publicDb();
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

/**
 * A value that was never saved falls back to the built-in default;
 * an explicitly saved empty string means "hide it".
 */
export type SettingsRow = {
  announcement: string | null;
  socials: unknown;
  google_site_verification?: string | null;
  popup_enabled?: boolean | null;
  popup_heading?: string | null;
  popup_body?: string | null;
  popup_code?: string | null;
  hero_image_url?: string | null;
};

export const SETTINGS_COLUMNS =
  "announcement, socials, google_site_verification, popup_enabled, popup_heading, popup_body, popup_code, hero_image_url";

/** The shape before the pop-up migration; used only as a fallback while that migration is pending. */
export const LEGACY_SETTINGS_COLUMNS = "announcement, socials, google_site_verification";

export function resolveSettings(data: SettingsRow | null): SiteSettings {
  if (!data) {
    return {
      announcement: defaultAnnouncement,
      socials: defaultSocials,
      googleSiteVerification: null,
      popup: defaultPopup,
      heroImageUrl: null,
    };
  }
  const saved = (data.socials ?? {}) as Partial<Record<keyof Socials, string>>;
  const socials = Object.fromEntries(
    Object.entries(defaultSocials).map(([key, fallback]) => [key, key in saved ? (saved[key as keyof Socials] ?? "") : fallback]),
  ) as Socials;
  const code = (data.popup_code ?? "").trim().toUpperCase();
  return {
    announcement: data.announcement ?? defaultAnnouncement,
    socials,
    googleSiteVerification: data.google_site_verification ?? null,
    popup: {
      // No code means nothing to give away, so the pop-up stays hidden whatever the switch says.
      enabled: Boolean(data.popup_enabled) && code.length > 0,
      heading: data.popup_heading || defaultPopup.heading,
      body: data.popup_body || defaultPopup.body,
      code,
    },
    heroImageUrl: data.hero_image_url || null,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag("settings");

  const db = publicDb();
  if (!db) return resolveSettings(null);

  const { data, error } = await db.from("site_settings").select(SETTINGS_COLUMNS).eq("id", 1).maybeSingle();
  if (error) {
    // 42703 = column does not exist: the pop-up columns arrive with a migration, so until that
    // has been run the shop keeps working on the older shape instead of failing.
    if (error.code !== "42703") throw new Error(`Could not load settings: ${error.message}`);
    const older = await db.from("site_settings").select(LEGACY_SETTINGS_COLUMNS).eq("id", 1).maybeSingle();
    if (older.error) throw new Error(`Could not load settings: ${older.error.message}`);
    return resolveSettings(older.data);
  }
  return resolveSettings(data);
}

async function getPageSeoMap(): Promise<Record<string, PageSeo>> {
  "use cache";
  cacheLife("days");
  cacheTag("seo");

  const db = publicDb();
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

  const db = publicDb();
  if (!db) return [];

  const { data, error } = await db
    .from("posts")
    .select(GUIDE_COLUMNS)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
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
