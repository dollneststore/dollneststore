import type { Category, Gender, Product, ProductStatus, Review, ReviewSource, Tint } from "@/lib/types";

export const PRODUCT_COLUMNS =
  "id, slug, title, description, price_pence, compare_at_price_pence, category_slug, gender, length_in, weight_lbs, stock_qty, status, is_featured, badge, sort_order, etsy_listing_id, product_images(id, url, alt, position)";

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
};

export function mapCategory(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    tint: row.tint,
    sortOrder: row.sort_order,
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
