"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { categorySchema, SLUG_PATTERN } from "@/lib/admin/validation";

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await adminContext();
  // The URL of an existing collection never changes (protects rankings and links).
  const originalSlug = SLUG_PATTERN.test(field(formData, "originalSlug")) ? field(formData, "originalSlug") : "";

  const parsed = categorySchema.safeParse({
    slug: originalSlug || field(formData, "slug"),
    name: field(formData, "name"),
    description: field(formData, "description"),
    intro: field(formData, "intro"),
    imageUrl: field(formData, "imageUrl"),
    tint: field(formData, "tint"),
    sortOrder: field(formData, "sortOrder") || "0",
    seoTitle: field(formData, "seoTitle"),
    seoDescription: field(formData, "seoDescription"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const v = parsed.data;
  const row = {
    name: v.name,
    description: v.description,
    intro: v.intro,
    image_url: v.imageUrl,
    tint: v.tint,
    sort_order: v.sortOrder,
    seo_title: v.seoTitle,
    seo_description: v.seoDescription,
  };

  if (originalSlug) {
    const { data: updated, error } = await supabase.from("categories").update(row).eq("slug", originalSlug).select("slug");
    if (error) {
      console.error("[admin/categories]", error.message);
      return { ok: false, message: "Could not save the collection." };
    }
    if (!updated?.length) return { ok: false, message: "This collection no longer exists." };
  } else {
    const { data: clash } = await supabase.from("products").select("id").eq("slug", v.slug).maybeSingle();
    if (clash) {
      return { ok: false, message: "A product already uses this URL.", fieldErrors: { slug: ["Already used by a product"] } };
    }
    const { error } = await supabase.from("categories").insert({ slug: v.slug, ...row });
    if (error) {
      if (error.code === "23505") return { ok: false, message: "This URL is already taken.", fieldErrors: { slug: ["Already in use"] } };
      console.error("[admin/categories]", error.message);
      return { ok: false, message: "Could not create the collection." };
    }
  }

  updateTag("categories");
  if (!originalSlug) redirect(`/admin/categories/${v.slug}`);
  return { ok: true, message: "Collection saved ♡" };
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await adminContext();
  const slug = z.string().regex(SLUG_PATTERN).parse(formData.get("slug"));
  const { error } = await supabase.from("categories").delete().eq("slug", slug);
  if (error) throw new Error("Could not delete the collection");
  updateTag("categories");
  updateTag("products");
  redirect("/admin/categories");
}
