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
    tiktok: field(formData, "tiktok"),
    etsy: field(formData, "etsy"),
    vinted: field(formData, "vinted"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // Empty strings are stored on purpose: they hide the announcement bar / a social link
  // (a missing value falls back to the built-in default).
  const { announcement, ...socials } = parsed.data;
  const { error } = await supabase
    .from("site_settings")
    .update({
      announcement,
      socials: Object.fromEntries(Object.entries(socials).map(([key, url]) => [key, url ?? ""])),
    })
    .eq("id", 1);
  if (error) {
    console.error("[admin/settings]", error.message);
    return { ok: false, message: "Could not save settings." };
  }

  updateTag("settings");
  return { ok: true, message: "Settings saved ♡" };
}
