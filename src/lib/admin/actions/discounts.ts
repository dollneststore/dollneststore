"use server";

import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { DISCOUNT_CODE_PATTERN, discountSchema } from "@/lib/admin/validation";

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

/**
 * The UTC instant for a wall-clock moment in London, so British Summer Time can't shift a
 * code's first or last day by one (a code set to end on the 30th really ends on the 30th).
 */
function londonInstant(date: string, edge: "start" | "end") {
  const wall = new Date(`${date}T${edge === "start" ? "00:00:00" : "23:59:59"}Z`);
  const offset =
    new Date(wall.toLocaleString("en-US", { timeZone: "Europe/London" })).getTime() -
    new Date(wall.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(wall.getTime() - offset).toISOString();
}

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

  // Re-saving a code replaces all of its settings, so it can't happen by accident.
  const { data: existing } = await supabase.from("discount_codes").select("code").eq("code", v.code).maybeSingle();
  if (existing && formData.get("overwrite") !== "on") {
    return {
      ok: false,
      message: `${v.code} already exists.`,
      fieldErrors: { code: ["Tick “Replace the existing code” below to change its settings"] },
    };
  }

  const { error } = await supabase.from("discount_codes").upsert(
    {
      code: v.code,
      percent_off: v.percentOff,
      is_active: v.isActive,
      // Both edges are London wall-clock, so the code covers exactly the days chosen.
      starts_at: v.startsAt ? londonInstant(v.startsAt, "start") : null,
      expires_at: v.expiresAt ? londonInstant(v.expiresAt, "end") : null,
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
