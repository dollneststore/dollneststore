import "server-only";
import { z } from "zod";
import { resolveSettings } from "@/lib/data/catalog";
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
} from "@/lib/data/mappers";
import {
  orderStatuses,
  productStatuses,
  type Category,
  type Guide,
  type OrderChannel,
  type OrderStatus,
  type PageSeo,
  type Product,
  type Review,
  type SiteSettings,
} from "@/lib/types";
import { adminContext } from "./context";
import type { AdminOrder, AdminOrderListItem, DashboardStats, ProductFilters, ProductOption } from "./types";
import { SLUG_PATTERN } from "./validation";

const ORDER_LIST_COLUMNS = "id, order_number, status, channel, customer_name, total_pence, created_at";

type OrderListRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  channel: OrderChannel;
  customer_name: string;
  total_pence: number;
  created_at: string;
};

function mapOrderListItem(row: OrderListRow): AdminOrderListItem {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    channel: row.channel,
    customerName: row.customer_name,
    totalPence: row.total_pence,
    createdAt: row.created_at,
  };
}

const isUuid = (value: string) => z.uuid().safeParse(value).success;

/**
 * Search text for PostgREST `or()` filters: keep letters, numbers and a few safe symbols only,
 * so commas, parentheses and wildcards can't change the filter.
 */
function searchTerm(value: string | undefined, extra = "") {
  const pattern = new RegExp(`[^\\p{L}\\p{N} '\\-${extra}]`, "gu");
  return (value ?? "").replace(pattern, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export async function getAdminProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const { supabase } = await adminContext();
  let query = supabase.from("products").select(PRODUCT_COLUMNS);

  const q = searchTerm(filters.q);
  if (q) query = query.or(`title.ilike.%${q}%,slug.ilike.%${q.replace(/\s+/g, "-")}%`);

  const status = z.enum(productStatuses).safeParse(filters.status);
  if (status.success) query = query.eq("status", status.data);

  if (filters.collection === "none") query = query.is("category_slug", null);
  else if (filters.collection && SLUG_PATTERN.test(filters.collection)) query = query.eq("category_slug", filters.collection);

  if (filters.stock === "out") query = query.eq("stock_qty", 0);
  else if (filters.stock === "in") query = query.gt("stock_qty", 0);

  const { data, error } = await query.order("sort_order").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  if (!isUuid(id)) return null;
  const { supabase } = await adminContext();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data as ProductRow) : null;
}

export async function getAdminCategories(): Promise<Category[]> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase.from("categories").select(CATEGORY_COLUMNS).order("sort_order");
  if (error) throw new Error(error.message);
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getAdminCategory(slug: string): Promise<Category | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  const { supabase } = await adminContext();
  const { data, error } = await supabase.from("categories").select(CATEGORY_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCategory(data as CategoryRow) : null;
}

export async function getAdminGuides(): Promise<Guide[]> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase.from("posts").select(GUIDE_COLUMNS).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as GuideRow[]).map(mapGuide);
}

export async function getAdminGuide(id: string): Promise<Guide | null> {
  if (!isUuid(id)) return null;
  const { supabase } = await adminContext();
  const { data, error } = await supabase.from("posts").select(GUIDE_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapGuide(data as GuideRow) : null;
}

export async function getAdminSeo(): Promise<{ pages: Record<string, PageSeo>; googleSiteVerification: string | null }> {
  const { supabase } = await adminContext();
  const [pages, settings] = await Promise.all([
    supabase.from("page_seo").select("path, title, description, og_image_url"),
    supabase.from("site_settings").select("google_site_verification").eq("id", 1).maybeSingle(),
  ]);
  if (pages.error) throw new Error(pages.error.message);
  if (settings.error) throw new Error(settings.error.message);
  return {
    pages: Object.fromEntries((pages.data as PageSeoRow[]).map((row) => [row.path, mapPageSeo(row)])),
    googleSiteVerification: settings.data?.google_site_verification ?? null,
  };
}

export async function getProductOptions(): Promise<ProductOption[]> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase
    .from("products")
    .select("id, title, price_pence, stock_qty")
    .eq("status", "active")
    .gt("stock_qty", 0)
    .order("title");
  if (error) throw new Error(error.message);
  return data.map((p) => ({ id: p.id, title: p.title, pricePence: p.price_pence, stockQty: p.stock_qty }));
}

/** Every product (any status) so a review can be linked to a doll that has since sold. */
export async function getReviewProductOptions(): Promise<{ id: string; title: string }[]> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase.from("products").select("id, title, slug").order("title");
  if (error) throw new Error(error.message);
  return data.map((p) => ({ id: p.id, title: `${p.title} (${p.slug})` }));
}

export async function getAdminOrders(filters: { status?: string; q?: string } = {}): Promise<AdminOrderListItem[]> {
  const { supabase } = await adminContext();
  let query = supabase.from("orders").select(ORDER_LIST_COLUMNS);

  const status = z.enum(orderStatuses).safeParse(filters.status);
  if (status.success) query = query.eq("status", status.data);

  const q = searchTerm(filters.q, "@.+");
  if (q) {
    query = query.or(
      ["order_number", "customer_name", "customer_email", "customer_phone", "shipping_postcode"].map((column) => `${column}.ilike.%${q}%`).join(","),
    );
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return (data as OrderListRow[]).map(mapOrderListItem);
}

export async function getAdminOrder(id: string): Promise<AdminOrder | null> {
  if (!isUuid(id)) return null;
  const { supabase } = await adminContext();
  const { data: row, error } = await supabase
    .from("orders")
    .select("*, order_items(id, product_id, title, unit_price_pence, quantity, image_url)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  return {
    ...mapOrderListItem(row as OrderListRow),
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingLine1: row.shipping_line1,
    shippingLine2: row.shipping_line2,
    shippingCity: row.shipping_city,
    shippingCounty: row.shipping_county,
    shippingPostcode: row.shipping_postcode,
    shippingCountry: row.shipping_country,
    subtotalPence: row.subtotal_pence,
    shippingPence: row.shipping_pence,
    discountPence: row.discount_pence,
    carrier: row.carrier,
    trackingNumber: row.tracking_number,
    notes: row.notes,
    paidAt: row.paid_at,
    dispatchedAt: row.dispatched_at,
    items: (row.order_items ?? []).map(
      (item: { id: string; product_id: string | null; title: string; unit_price_pence: number; quantity: number; image_url: string | null }) => ({
        id: item.id,
        productId: item.product_id,
        title: item.title,
        unitPricePence: item.unit_price_pence,
        quantity: item.quantity,
        imageUrl: item.image_url,
      }),
    ),
  };
}

export async function getAdminReviews(): Promise<Review[]> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data as ReviewRow[]).map(mapReview);
}

/** How many photos (products, collection covers, reviews) still load from Etsy rather than our own storage. */
export async function getEtsyPhotoCount(): Promise<number> {
  const { supabase } = await adminContext();
  const [images, categories, reviews] = await Promise.all([
    supabase.from("product_images").select("id", { count: "exact", head: true }).is("storage_path", null).like("url", "%i.etsystatic.com%"),
    supabase.from("categories").select("slug", { count: "exact", head: true }).like("image_url", "%i.etsystatic.com%"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).like("image_url", "%i.etsystatic.com%"),
  ]);
  const failure = [images, categories, reviews].find((r) => r.error)?.error;
  if (failure) throw new Error(failure.message);
  return (images.count ?? 0) + (categories.count ?? 0) + (reviews.count ?? 0);
}

export async function getAdminSettings(): Promise<SiteSettings> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase
    .from("site_settings")
    .select("announcement, socials, google_site_verification")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return resolveSettings(data);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase } = await adminContext();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const count = { count: "exact" as const, head: true };

  const [
    products,
    openOrders,
    recentRevenue,
    subscribers,
    recent,
    toDispatch,
    awaitingPayment,
    activeOutOfStock,
    draftProducts,
    draftGuides,
    unlinkedReviews,
  ] = await Promise.all([
    supabase.from("products").select("id", count).eq("status", "active").gt("stock_qty", 0),
    supabase.from("orders").select("id", count).in("status", ["pending", "paid", "processing"]),
    supabase.from("orders").select("total_pence").in("status", ["paid", "processing", "dispatched", "delivered"]).gte("paid_at", since),
    supabase.from("newsletter_subscribers").select("id", count).is("unsubscribed_at", null),
    supabase.from("orders").select(ORDER_LIST_COLUMNS).order("created_at", { ascending: false }).limit(6),
    supabase
      .from("orders")
      .select(ORDER_LIST_COLUMNS, { count: "exact" })
      .in("status", ["paid", "processing"])
      .order("created_at", { ascending: true })
      .limit(5),
    supabase.from("orders").select("id", count).eq("status", "pending"),
    supabase.from("products").select("id", count).eq("status", "active").eq("stock_qty", 0),
    supabase.from("products").select("id", count).eq("status", "draft"),
    supabase.from("posts").select("id", count).eq("status", "draft"),
    supabase.from("reviews").select("id", count).eq("is_published", true).is("product_id", null),
  ]);

  const firstError = [
    products,
    openOrders,
    recentRevenue,
    subscribers,
    recent,
    toDispatch,
    awaitingPayment,
    activeOutOfStock,
    draftProducts,
    draftGuides,
    unlinkedReviews,
  ].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const revenueRows = recentRevenue.data ?? [];
  return {
    activeProducts: products.count ?? 0,
    openOrders: openOrders.count ?? 0,
    orders30d: revenueRows.length,
    revenue30dPence: revenueRows.reduce((sum, r) => sum + r.total_pence, 0),
    subscribers: subscribers.count ?? 0,
    recentOrders: ((recent.data ?? []) as OrderListRow[]).map(mapOrderListItem),
    todo: {
      toDispatch: ((toDispatch.data ?? []) as OrderListRow[]).map(mapOrderListItem),
      toDispatchCount: toDispatch.count ?? 0,
      awaitingPayment: awaitingPayment.count ?? 0,
      activeOutOfStock: activeOutOfStock.count ?? 0,
      draftProducts: draftProducts.count ?? 0,
      draftGuides: draftGuides.count ?? 0,
      unlinkedReviews: unlinkedReviews.count ?? 0,
    },
  };
}
