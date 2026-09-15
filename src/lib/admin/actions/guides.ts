"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { guideSchema } from "@/lib/admin/validation";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/public";

const COVER_PATH = /^guides\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;
const isUuid = (value: string) => z.uuid().safeParse(value).success;
const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

/**
 * Keeps an existing timestamp when the date wasn't changed, publishes "today" immediately,
 * and schedules other dates for 09:00 UTC.
 */
function resolvePublishedAt(submittedDate: string | null, existing: string | null, status: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (submittedDate) {
    if (existing && existing.slice(0, 10) === submittedDate) return existing;
    if (submittedDate === today) return new Date().toISOString();
    return new Date(`${submittedDate}T09:00:00Z`).toISOString();
  }
  return existing ?? (status === "published" ? new Date().toISOString() : null);
}

export async function saveGuide(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await adminContext();
  const rawId = field(formData, "id");
  const guideId = isUuid(rawId) ? rawId : null;

  const parsed = guideSchema.safeParse({
    title: field(formData, "title"),
    slug: field(formData, "slug"),
    excerpt: field(formData, "excerpt"),
    body: field(formData, "body"),
    status: field(formData, "status"),
    publishedAt: field(formData, "publishedAt"),
    seoTitle: field(formData, "seoTitle"),
    seoDescription: field(formData, "seoDescription"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const v = parsed.data;

  let existing: { published_at: string | null; cover_storage_path: string | null } | null = null;
  if (guideId) {
    const { data } = await supabase.from("posts").select("published_at, cover_storage_path").eq("id", guideId).maybeSingle();
    if (!data) return { ok: false, message: "Guide not found." };
    existing = data;
  }

  const publishedAt = resolvePublishedAt(v.publishedAt, existing?.published_at ?? null, v.status);
  const row: Record<string, string | null> = {
    title: v.title,
    slug: v.slug,
    excerpt: v.excerpt,
    body: v.body,
    status: v.status,
    published_at: publishedAt,
    seo_title: v.seoTitle,
    seo_description: v.seoDescription,
  };

  const coverPath = field(formData, "coverPath");
  let replacedCover = false;
  if (COVER_PATH.test(coverPath) && coverPath !== existing?.cover_storage_path) {
    row.cover_storage_path = coverPath;
    row.cover_image_url = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(coverPath).data.publicUrl;
    replacedCover = true;
  } else if (formData.get("removeCover") === "on") {
    row.cover_storage_path = null;
    row.cover_image_url = null;
    replacedCover = true;
  }

  let id = guideId;
  if (guideId) {
    const { error } = await supabase.from("posts").update(row).eq("id", guideId);
    if (error) return guideError(error);
  } else {
    const { data, error } = await supabase.from("posts").insert(row).select("id").single();
    if (error) return guideError(error);
    id = data.id;
  }

  if (replacedCover && existing?.cover_storage_path) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([existing.cover_storage_path]);
  }

  updateTag("guides");
  if (!guideId) redirect(`/admin/guides/${id}?created=1`);

  const scheduled = v.status === "published" && publishedAt && new Date(publishedAt) > new Date();
  return {
    ok: true,
    message: v.status !== "published" ? "Draft saved ♡" : scheduled ? "Saved — the guide will go live on its publish date ♡" : "Saved — the guide is live ♡",
  };
}

function guideError(error: { code?: string; message: string }): FormState {
  if (error.code === "23505") return { ok: false, message: "Another guide already uses this URL.", fieldErrors: { slug: ["Already in use"] } };
  console.error("[admin/guides]", error.message);
  return { ok: false, message: "Could not save the guide." };
}

export async function deleteGuide(formData: FormData) {
  const { supabase } = await adminContext();
  const id = z.uuid().parse(formData.get("id"));
  const { data } = await supabase.from("posts").select("cover_storage_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error("Could not delete the guide");
  if (data?.cover_storage_path) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([data.cover_storage_path]);
  updateTag("guides");
  redirect("/admin/guides");
}
