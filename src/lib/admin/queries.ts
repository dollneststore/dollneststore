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
import type { AdminOrder, AdminOrderListItem, DashboardStats, ProductOption } from "./types";
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

export async function getAdminProducts(): Promise<Product[]> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("sort_order")
    .order("created_at", { ascending: false });
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

export async function getAdminOrders(status?: string): Promise<AdminOrderListItem[]> {
  const { supabase } = await adminContext();
  let query = supabase.from("orders").select(ORDER_LIST_COLUMNS);
  const parsedStatus = z.enum(orderStatuses).safeParse(status);
  if (parsedStatus.success) query = query.eq("status", parsedStatus.data);
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

  const [products, openOrders, recentRevenue, subscribers, recent] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active").gt("stock_qty", 0),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "paid", "processing"]),
    supabase
      .from("orders")
      .select("total_pence")
      .in("status", ["paid", "processing", "dispatched", "delivered"])
      .gte("paid_at", since),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).is("unsubscribed_at", null),
    supabase.from("orders").select(ORDER_LIST_COLUMNS).order("created_at", { ascending: false }).limit(6),
  ]);

  const firstError = [products, openOrders, recentRevenue, subscribers, recent].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const revenueRows = recentRevenue.data ?? [];
  return {
    activeProducts: products.count ?? 0,
    openOrders: openOrders.count ?? 0,
    orders30d: revenueRows.length,
    revenue30dPence: revenueRows.reduce((sum, r) => sum + r.total_pence, 0),
    subscribers: subscribers.count ?? 0,
    recentOrders: ((recent.data ?? []) as OrderListRow[]).map(mapOrderListItem),
  };
}
