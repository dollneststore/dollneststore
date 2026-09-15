import "server-only";
import { z } from "zod";
import {
  mapCategory,
  mapProduct,
  mapReview,
  PRODUCT_COLUMNS,
  type CategoryRow,
  type ProductRow,
  type ReviewRow,
} from "@/lib/data/mappers";
import { defaultAnnouncement, defaultSocials } from "@/lib/site";
import { orderStatuses, type Category, type OrderChannel, type OrderStatus, type Product, type Review, type SiteSettings, type Socials } from "@/lib/types";
import { adminContext } from "./context";
import type { AdminOrder, AdminOrderListItem, DashboardStats, ProductOption } from "./types";

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
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name, description, image_url, tint, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data as CategoryRow[]).map(mapCategory);
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
    .select("id, author_name, rating, body, source, image_url, reviewed_at, is_published")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data as ReviewRow[]).map(mapReview);
}

export async function getAdminSettings(): Promise<SiteSettings> {
  const { supabase } = await adminContext();
  const { data, error } = await supabase.from("site_settings").select("announcement, socials").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  const saved = (data?.socials ?? {}) as Partial<Socials>;
  return {
    announcement: data?.announcement || defaultAnnouncement,
    socials: { ...defaultSocials, ...Object.fromEntries(Object.entries(saved).filter(([, v]) => Boolean(v))) },
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase } = await adminContext();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [products, openOrders, recentRevenue, subscribers, recent] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "paid", "processing"]),
    supabase
      .from("orders")
      .select("total_pence")
      .in("status", ["paid", "processing", "dispatched", "delivered"])
      .gte("created_at", since),
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
