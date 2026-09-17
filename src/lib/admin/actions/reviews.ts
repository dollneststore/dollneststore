"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import type { FormState } from "@/lib/admin/form-state";
import { reviewPhotoSchema, reviewSchema } from "@/lib/admin/validation";

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function createReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await adminContext();
  const parsed = reviewSchema.safeParse({
    authorName: field(formData, "authorName"),
    rating: field(formData, "rating"),
    body: field(formData, "body"),
    source: field(formData, "source"),
    reviewedAt: field(formData, "reviewedAt"),
    imageUrl: field(formData, "imageUrl"),
    productId: field(formData, "productId"),
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const v = parsed.data;
  const { error } = await supabase.from("reviews").insert({
    author_name: v.authorName,
    rating: v.rating,
    body: v.body,
    source: v.source,
    reviewed_at: v.reviewedAt,
    image_url: v.imageUrl,
    product_id: v.productId,
    is_published: v.isPublished,
  });
  if (error) {
    console.error("[admin/reviews]", error.message);
    return { ok: false, message: error.code === "23503" ? "That product no longer exists." : "Could not save the review." };
  }

  updateTag("reviews");
  return { ok: true, message: "Review added ♡" };
}

/** Adds, replaces or clears the customer photo on a review that is already saved. */
export async function setReviewPhoto(formData: FormData) {
  const { supabase } = await adminContext();
  const { id, imageUrl } = reviewPhotoSchema.parse({
    id: formData.get("id"),
    imageUrl: String(formData.get("imageUrl") ?? ""),
  });
  const { error } = await supabase.from("reviews").update({ image_url: imageUrl }).eq("id", id);
  if (error) throw new Error("Could not save the photo");
  updateTag("reviews");
}

export async function setReviewPublished(formData: FormData) {
  const { supabase } = await adminContext();
  const id = z.uuid().parse(formData.get("id"));
  const publish = formData.get("publish") === "true";
  const { error } = await supabase.from("reviews").update({ is_published: publish }).eq("id", id);
  if (error) throw new Error("Could not update the review");
  updateTag("reviews");
}

export async function deleteReview(formData: FormData) {
  const { supabase } = await adminContext();
  const id = z.uuid().parse(formData.get("id"));
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error("Could not delete the review");
  updateTag("reviews");
}
