"use client";

import { useState } from "react";
import { createManualOrder, updateOrder } from "@/lib/admin/actions/orders";
import type { AdminOrder, ProductOption } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import { orderChannels, orderStatuses } from "@/lib/types";
import { adminButton, adminButtonSecondary, AdminCard, Field, FormMessage, inputClass } from "./form-ui";
import { useFormAction } from "./use-form-action";

export function OrderUpdateForm({ order }: { order: AdminOrder }) {
  const { state, pending, onSubmit } = useFormAction(updateOrder);
  const errors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit}>
      <AdminCard title="Update order">
        <input type="hidden" name="id" value={order.id} />
        <Field label="Status" htmlFor="status" error={errors.status}>
          <select id="status" name="status" defaultValue={order.status} className={inputClass}>
            {orderStatuses.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Carrier" htmlFor="carrier" error={errors.carrier}>
          <input id="carrier" name="carrier" list="carriers" defaultValue={order.carrier ?? ""} className={inputClass} />
          <datalist id="carriers">
            <option value="Royal Mail Tracked 24" />
            <option value="Royal Mail Tracked 48" />
            <option value="Evri" />
            <option value="DPD" />
            <option value="Parcelforce" />
          </datalist>
        </Field>
        <Field label="Tracking number" htmlFor="trackingNumber" error={errors.trackingNumber}>
          <input id="trackingNumber" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className={inputClass} />
        </Field>
        <Field label="Internal notes" htmlFor="notes" error={errors.notes}>
          <textarea id="notes" name="notes" rows={4} defaultValue={order.notes ?? ""} className={inputClass} />
        </Field>
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={adminButton}>
          {pending ? "Saving…" : "Save"}
        </button>
      </AdminCard>
    </form>
  );
}

export function ManualOrderForm({ products }: { products: ProductOption[] }) {
  const { state, pending, onSubmit } = useFormAction(createManualOrder);
  const [rows, setRows] = useState(1);
  const errors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        <AdminCard title="Babies">
          {products.length === 0 ? <p className="text-sm text-muted">There are no active products with stock.</p> : null}
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="grid grid-cols-[1fr_90px] gap-3">
              <select name="itemProduct" aria-label={`Baby ${index + 1}`} defaultValue="" className={inputClass}>
                <option value="">Choose a baby…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {formatPrice(p.pricePence)} ({p.stockQty} in stock)
                  </option>
                ))}
              </select>
              <input name="itemQty" type="number" min={1} max={20} defaultValue={1} aria-label="Quantity" className={inputClass} />
            </div>
          ))}
          {rows < 10 ? (
            <button type="button" onClick={() => setRows((r) => r + 1)} className={`${adminButtonSecondary} w-fit`}>
              + Add another baby
            </button>
          ) : null}
        </AdminCard>

        <AdminCard title="Customer">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="customerName" error={errors.customerName}>
              <input id="customerName" name="customerName" required autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Phone" htmlFor="customerPhone" error={errors.customerPhone}>
              <input id="customerPhone" name="customerPhone" type="tel" autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Email" htmlFor="customerEmail" error={errors.customerEmail}>
              <input id="customerEmail" name="customerEmail" type="email" autoComplete="off" className={inputClass} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Delivery address">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Address line 1" htmlFor="line1" error={errors.line1}>
              <input id="line1" name="line1" autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Address line 2" htmlFor="line2" error={errors.line2}>
              <input id="line2" name="line2" autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Town / city" htmlFor="city" error={errors.city}>
              <input id="city" name="city" autoComplete="off" className={inputClass} />
            </Field>
            <Field label="County" htmlFor="county" error={errors.county}>
              <input id="county" name="county" autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Postcode" htmlFor="postcode" error={errors.postcode}>
              <input id="postcode" name="postcode" autoComplete="off" className={`${inputClass} uppercase`} />
            </Field>
          </div>
        </AdminCard>
      </div>

      <div className="flex flex-col gap-6 xl:sticky xl:top-6">
        <AdminCard title="Order">
          <Field label="Sold via" htmlFor="channel" error={errors.channel}>
            <select id="channel" name="channel" defaultValue="whatsapp" className={inputClass}>
              {orderChannels.map((c) => (
                <option key={c} value={c}>
                  {c === "whatsapp" ? "WhatsApp" : c === "tiktok" ? "TikTok" : c === "ebay" ? "eBay" : c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Payment" htmlFor="status" error={errors.status}>
            <select id="status" name="status" defaultValue="paid" className={inputClass}>
              <option value="paid">Paid</option>
              <option value="pending">Awaiting payment</option>
            </select>
          </Field>
          <Field label="Delivery charge (£)" htmlFor="shipping" error={errors.shipping} hint="Leave empty for free delivery.">
            <input id="shipping" name="shipping" inputMode="decimal" className={inputClass} />
          </Field>
          <Field label="Notes" htmlFor="notes" error={errors.notes}>
            <textarea id="notes" name="notes" rows={3} className={inputClass} />
          </Field>
        </AdminCard>
        <FormMessage state={state} />
        <button type="submit" disabled={pending || products.length === 0} className={adminButton}>
          {pending ? "Saving…" : "Record order"}
        </button>
        <p className="text-xs text-muted">Stock is reduced automatically. Babies reaching 0 are marked as rehomed.</p>
      </div>
    </form>
  );
}
