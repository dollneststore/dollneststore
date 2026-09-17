"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { settingsSchema } from "@/lib/admin/validation";

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await adminContext();
  const parsed = settingsSchema.safeParse({
    announcement: field(formData, "announcement"),
    heroImageUrl: field(formData, "heroImageUrl"),
    popupEnabled: formData.get("popupEnabled") === "on",
    popupHeading: field(formData, "popupHeading"),
    popupBody: field(formData, "popupBody"),
    popupCode: field(formData, "popupCode"),
    tiktok: field(formData, "tiktok"),
    etsy: field(formData, "etsy"),
    vinted: field(formData, "vinted"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // Empty strings are stored on purpose: they hide the announcement bar / a social link
  // (a missing value falls back to the built-in default).
  const { announcement, heroImageUrl, popupEnabled, popupHeading, popupBody, popupCode, ...socials } = parsed.data;

  if (popupEnabled && popupCode) {
    // A pop-up advertising a code that doesn't work would be worse than no pop-up.
    const { data: code } = await supabase.from("discount_codes").select("code, is_active").eq("code", popupCode).maybeSingle();
    if (!code) {
      return { ok: false, message: "That discount code doesn't exist yet.", fieldErrors: { popupCode: ["Create it under Discounts first"] } };
    }
    if (!code.is_active) {
      return { ok: false, message: "That discount code is switched off.", fieldErrors: { popupCode: ["Switch it on under Discounts"] } };
    }
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      announcement,
      socials: Object.fromEntries(Object.entries(socials).map(([key, url]) => [key, url ?? ""])),
      popup_enabled: popupEnabled,
      popup_heading: popupHeading || null,
      popup_body: popupBody || null,
      popup_code: popupCode,
      hero_image_url: heroImageUrl,
    })
    .eq("id", 1);
  if (error) {
    console.error("[admin/settings]", error.message);
    return { ok: false, message: "Could not save settings." };
  }

  updateTag("settings");
  return { ok: true, message: "Settings saved ♡" };
}
