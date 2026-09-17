"use server";

import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { DISCOUNT_CODE_PATTERN, discountSchema } from "@/lib/admin/validation";

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

/** Creates a code, or updates it if the same code is submitted again. */
export async function saveDiscountCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await adminContext();
  const parsed = discountSchema.safeParse({
    code: field(formData, "code"),
    percentOff: field(formData, "percentOff") || "10",
    isActive: formData.get("isActive") === "on",
    startsAt: field(formData, "startsAt"),
    expiresAt: field(formData, "expiresAt"),
    maxUses: field(formData, "maxUses"),
    note: field(formData, "note"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const v = parsed.data;
  if (v.startsAt && v.expiresAt && v.expiresAt < v.startsAt) {
    return { ok: false, message: "The end date is before the start date.", fieldErrors: { expiresAt: ["Must be after the start date"] } };
  }

  const { error } = await supabase.from("discount_codes").upsert(
    {
      code: v.code,
      percent_off: v.percentOff,
      is_active: v.isActive,
      starts_at: v.startsAt,
      // Stored as the end of the chosen day, so a code works all day on its last day.
      expires_at: v.expiresAt ? `${v.expiresAt}T23:59:59Z` : null,
      max_uses: v.maxUses,
      note: v.note,
    },
    { onConflict: "code" },
  );
  if (error) {
    console.error("[admin/discounts]", error.message);
    return { ok: false, message: "Could not save the discount code." };
  }

  return { ok: true, message: `${v.code} saved ♡` };
}

export async function setDiscountActive(formData: FormData) {
  const { supabase } = await adminContext();
  const code = z.string().regex(DISCOUNT_CODE_PATTERN).parse(formData.get("code"));
  const active = formData.get("active") === "true";
  const { error } = await supabase.from("discount_codes").update({ is_active: active }).eq("code", code);
  if (error) throw new Error("Could not update the discount code");
}

export async function deleteDiscountCode(formData: FormData) {
  const { supabase } = await adminContext();
  const code = z.string().regex(DISCOUNT_CODE_PATTERN).parse(formData.get("code"));
  const { error } = await supabase.from("discount_codes").delete().eq("code", code);
  if (error) throw new Error("Could not delete the discount code");
}
