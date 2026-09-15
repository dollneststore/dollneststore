"use server";

import { updateTag } from "next/cache";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { verificationSchema } from "@/lib/admin/validation";
import { pageSeoDefaults } from "@/lib/content/page-seo";

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function savePageSeo(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await adminContext();
  const fieldErrors: Record<string, string[]> = {};

  const rows = Object.keys(pageSeoDefaults).map((path) => {
    const title = field(formData, `title:${path}`);
    const description = field(formData, `description:${path}`);
    if (title.length > 70) fieldErrors[`title:${path}`] = ["Keep it under 70 characters"];
    if (description.length > 170) fieldErrors[`description:${path}`] = ["Keep it under 170 characters"];
    return { path, title: title || null, description: description || null };
  });

  const verification = verificationSchema.safeParse(field(formData, "googleVerification"));
  if (!verification.success) {
    fieldErrors.googleVerification = [verification.error.issues[0]?.message ?? "Invalid code"];
  }
  if (Object.keys(fieldErrors).length || !verification.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }

  const [pages, settings] = await Promise.all([
    supabase.from("page_seo").upsert(rows, { onConflict: "path" }),
    supabase.from("site_settings").update({ google_site_verification: verification.data }).eq("id", 1),
  ]);
  const error = pages.error ?? settings.error;
  if (error) {
    console.error("[admin/seo]", error.message);
    return { ok: false, message: "Could not save SEO settings." };
  }

  updateTag("seo");
  updateTag("settings");
  return { ok: true, message: "SEO saved ♡ Google will pick up changes on its next visit." };
}
