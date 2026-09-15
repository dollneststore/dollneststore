export const productStatuses = ["draft", "active", "sold_out", "archived"] as const;
export const genders = ["girl", "boy", "unisex"] as const;
export const tints = ["rose", "lilac", "peach", "sage", "sky"] as const;
export const reviewSources = ["website", "etsy", "vinted", "ebay", "tiktok"] as const;
export const orderStatuses = ["pending", "paid", "processing", "dispatched", "delivered", "cancelled", "refunded"] as const;
export const orderChannels = ["website", "whatsapp", "etsy", "vinted", "ebay", "tiktok", "other"] as const;

export type ProductStatus = (typeof productStatuses)[number];
export type Gender = (typeof genders)[number];
export type Tint = (typeof tints)[number];
export type ReviewSource = (typeof reviewSources)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type OrderChannel = (typeof orderChannels)[number];

export type ProductImage = {
  id?: string;
  url: string;
  alt: string | null;
  position?: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pricePence: number;
  compareAtPricePence: number | null;
  categorySlug: string | null;
  gender: Gender;
  lengthIn: number | null;
  weightLbs: number | null;
  stockQty: number;
  status: ProductStatus;
  isFeatured: boolean;
  badge: string | null;
  sortOrder: number;
  etsyListingId: string | null;
  images: ProductImage[];
};

export type Category = {
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  tint: Tint;
  sortOrder: number;
};

export type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  source: ReviewSource;
  imageUrl: string | null;
  reviewedAt: string | null;
  isPublished?: boolean;
};

export type Socials = {
  tiktok: string;
  instagram: string;
  etsy: string;
  vinted: string;
  ebay: string;
};

export type SiteSettings = {
  announcement: string;
  socials: Socials;
};

export type CartProduct = {
  productId: string;
  slug: string;
  title: string;
  pricePence: number;
  image: string | null;
  maxQty: number;
};

export type CartItem = CartProduct & { qty: number };

export function toCartProduct(p: Product): CartProduct {
  return {
    productId: p.id,
    slug: p.slug,
    title: p.title,
    pricePence: p.pricePence,
    image: p.images[0]?.url ?? null,
    maxQty: Math.max(1, p.stockQty),
  };
}
