"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { manualOrderSchema, orderUpdateSchema } from "@/lib/admin/validation";

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

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

  // Status, timestamps and restocking happen in one transaction (public.update_order_status).
  const v = parsed.data;
  const { error } = await supabase.rpc("update_order_status", {
    p_order_id: id.data,
    p_status: v.status,
    p_carrier: v.carrier,
    p_tracking: v.trackingNumber,
    p_notes: v.notes,
  });
  if (error) {
    if (error.message.includes("order_closed")) {
      return { ok: false, message: "Cancelled or refunded orders can't be reopened. Record a new order instead." };
    }
    if (error.message.includes("order_missing")) return { ok: false, message: "Order not found." };
    console.error("[admin/orders]", error.message);
    return { ok: false, message: "Could not update the order." };
  }

  updateTag("products");
  return {
    ok: true,
    message: v.status === "cancelled" || v.status === "refunded" ? "Order updated ♡ Stock has been returned." : "Order updated ♡",
  };
}

/** Records an order taken outside the website (WhatsApp, Etsy, Vinted…) and reduces stock atomically. */
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

  const { data: orderId, error } = await supabase.rpc("create_manual_order", {
    p_order: {
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
      shipping_pence: v.shipping,
      notes: v.notes,
    },
    p_items: [...quantityById].map(([product_id, quantity]) => ({ product_id, quantity })),
  });

  if (error) {
    const stock = error.message.match(/insufficient_stock:(.+)/);
    if (stock) return { ok: false, message: `"${stock[1].trim()}" is no longer available in that quantity.` };
    if (error.message.includes("product_missing")) return { ok: false, message: "One of the selected babies no longer exists." };
    if (error.message.includes("order_too_large")) return { ok: false, message: "This order total is too large." };
    console.error("[admin/orders]", error.message);
    return { ok: false, message: "Could not create the order." };
  }

  updateTag("products");
  redirect(`/admin/orders/${orderId as string}`);
}
