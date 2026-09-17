import type {
  Category,
  DiscountCode,
  Gender,
  Guide,
  PageSeo,
  PostStatus,
  Product,
  ProductStatus,
  Review,
  ReviewSource,
  Tint,
} from "@/lib/types";

export const PRODUCT_COLUMNS =
  "id, slug, title, description, price_pence, compare_at_price_pence, category_slug, gender, length_in, weight_lbs, stock_qty, status, is_featured, badge, sort_order, etsy_listing_id, seo_title, seo_description, updated_at, product_images(id, url, alt, position)";

export const CATEGORY_COLUMNS = "slug, name, description, image_url, tint, sort_order, intro, seo_title, seo_description";

export const REVIEW_COLUMNS = "id, author_name, rating, body, source, image_url, reviewed_at, is_published";

export const DISCOUNT_COLUMNS = "code, percent_off, is_active, starts_at, expires_at, max_uses, times_used, note";

export const GUIDE_COLUMNS =
  "id, slug, title, excerpt, body, cover_image_url, seo_title, seo_description, status, published_at, updated_at";

export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_pence: number;
  compare_at_price_pence: number | null;
  category_slug: string | null;
  gender: Gender;
  length_in: number | string | null;
  weight_lbs: number | string | null;
  stock_qty: number;
  status: ProductStatus;
  is_featured: boolean;
  badge: string | null;
  sort_order: number;
  etsy_listing_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string | null;
  product_images: { id: string; url: string; alt: string | null; position: number }[] | null;
};

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    pricePence: row.price_pence,
    compareAtPricePence: row.compare_at_price_pence,
    categorySlug: row.category_slug,
    gender: row.gender,
    lengthIn: row.length_in == null ? null : Number(row.length_in),
    weightLbs: row.weight_lbs == null ? null : Number(row.weight_lbs),
    stockQty: row.stock_qty,
    status: row.status,
    isFeatured: row.is_featured,
    badge: row.badge,
    sortOrder: row.sort_order,
    etsyListingId: row.etsy_listing_id,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
    images: [...(row.product_images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ id: img.id, url: img.url, alt: img.alt, position: img.position })),
  };
}

export type CategoryRow = {
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  tint: Tint;
  sort_order: number;
  intro: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

export function mapCategory(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    tint: row.tint,
    sortOrder: row.sort_order,
    intro: row.intro,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

export type ReviewRow = {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  source: ReviewSource;
  image_url: string | null;
  reviewed_at: string | null;
  is_published: boolean;
};

export function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    authorName: row.author_name,
    rating: row.rating,
    body: row.body,
    source: row.source,
    imageUrl: row.image_url,
    reviewedAt: row.reviewed_at,
    isPublished: row.is_published,
  };
}

export type DiscountCodeRow = {
  code: string;
  percent_off: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  times_used: number;
  note: string | null;
};

export function mapDiscountCode(row: DiscountCodeRow): DiscountCode {
  return {
    code: row.code,
    percentOff: row.percent_off,
    isActive: row.is_active,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    timesUsed: row.times_used,
    note: row.note,
  };
}

export type GuideRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: PostStatus;
  published_at: string | null;
  updated_at: string | null;
};

export function mapGuide(row: GuideRow): Guide {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    coverImageUrl: row.cover_image_url,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export type PageSeoRow = {
  path: string;
  title: string | null;
  description: string | null;
  og_image_url: string | null;
};

export function mapPageSeo(row: PageSeoRow): PageSeo {
  return { path: row.path, title: row.title, description: row.description, ogImageUrl: row.og_image_url };
}
