"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { manualOrderSchema, orderUpdateSchema } from "@/lib/admin/validation";

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const PAID_STATUSES = ["paid", "processing", "dispatched", "delivered"];

export async function updateOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await adminContext();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Unknown order." };

  const parsed = orderUpdateSchema.safeParse({
    status: field(formData, "status"),
    carrier: field(formData, "carrier"),
    trackingNumber: field(formData, "trackingNumber"),
    notes: field(formData, "notes"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { data: current } = await supabase.from("orders").select("paid_at, dispatched_at").eq("id", id.data).maybeSingle();
  if (!current) return { ok: false, message: "Order not found." };

  const v = parsed.data;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("orders")
    .update({
      status: v.status,
      carrier: v.carrier,
      tracking_number: v.trackingNumber,
      notes: v.notes,
      paid_at: current.paid_at ?? (PAID_STATUSES.includes(v.status) ? now : null),
      dispatched_at: current.dispatched_at ?? (["dispatched", "delivered"].includes(v.status) ? now : null),
    })
    .eq("id", id.data);
  if (error) {
    console.error("[admin/orders]", error.message);
    return { ok: false, message: "Could not update the order." };
  }

  refresh();
  return { ok: true, message: "Order updated ♡" };
}

/** Records an order taken outside the website (WhatsApp, Etsy, Vinted…) and reduces stock. */
export async function createManualOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await adminContext();

  const quantities = formData.getAll("itemQty").map(String);
  const items = formData
    .getAll("itemProduct")
    .map(String)
    .map((productId, index) => ({ productId, quantity: quantities[index] || "1" }))
    .filter((item) => item.productId);

  const parsed = manualOrderSchema.safeParse({
    channel: field(formData, "channel"),
    status: field(formData, "status"),
    customerName: field(formData, "customerName"),
    customerEmail: field(formData, "customerEmail"),
    customerPhone: field(formData, "customerPhone"),
    line1: field(formData, "line1"),
    line2: field(formData, "line2"),
    city: field(formData, "city"),
    county: field(formData, "county"),
    postcode: field(formData, "postcode"),
    shipping: field(formData, "shipping"),
    notes: field(formData, "notes"),
    items,
  });
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return { ok: false, message: flat.fieldErrors.items?.[0] ?? "Please check the highlighted fields.", fieldErrors: flat.fieldErrors };
  }
  const v = parsed.data;

  const quantityById = new Map<string, number>();
  for (const item of v.items) quantityById.set(item.productId, (quantityById.get(item.productId) ?? 0) + item.quantity);

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, title, price_pence, stock_qty, product_images(url, position)")
    .in("id", [...quantityById.keys()]);
  if (productError || !products || products.length !== quantityById.size) {
    return { ok: false, message: "One of the selected babies no longer exists." };
  }
  for (const p of products) {
    if (p.stock_qty < quantityById.get(p.id)!) return { ok: false, message: `Only ${p.stock_qty} left of "${p.title}".` };
  }

  const subtotal = products.reduce((sum, p) => sum + p.price_pence * quantityById.get(p.id)!, 0);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      channel: v.channel,
      status: v.status,
      customer_name: v.customerName,
      customer_email: v.customerEmail,
      customer_phone: v.customerPhone,
      shipping_line1: v.line1,
      shipping_line2: v.line2,
      shipping_city: v.city,
      shipping_county: v.county,
      shipping_postcode: v.postcode,
      subtotal_pence: subtotal,
      shipping_pence: v.shipping,
      discount_pence: 0,
      total_pence: subtotal + v.shipping,
      notes: v.notes,
      paid_at: v.status === "paid" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (orderError) {
    console.error("[admin/orders]", orderError.message);
    return { ok: false, message: "Could not create the order." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    products.map((p) => {
      const images = [...((p.product_images ?? []) as { url: string; position: number }[])].sort((a, b) => a.position - b.position);
      return {
        order_id: order.id,
        product_id: p.id,
        title: p.title,
        unit_price_pence: p.price_pence,
        quantity: quantityById.get(p.id)!,
        image_url: images[0]?.url ?? null,
      };
    }),
  );
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    console.error("[admin/orders]", itemsError.message);
    return { ok: false, message: "Could not save the order items." };
  }

  for (const p of products) {
    const left = p.stock_qty - quantityById.get(p.id)!;
    await supabase
      .from("products")
      .update(left === 0 ? { stock_qty: 0, status: "sold_out" } : { stock_qty: left })
      .eq("id", p.id);
  }

  updateTag("products");
  redirect(`/admin/orders/${order.id}`);
}
