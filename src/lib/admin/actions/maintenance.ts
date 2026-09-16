"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { adminContext } from "@/lib/admin/context";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/service";

const ETSY_HOST = "i.etsystatic.com";
// Small batches keep every request well inside the serverless time limit.
const BATCH = 4;

export type PhotoMigrationResult = {
  copied: number;
  failed: number;
  remaining: number;
  error?: string;
};

function extensionFor(contentType: string | null, source: string) {
  if (contentType?.includes("png") || source.endsWith(".png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("avif")) return "avif";
  return "jpg";
}

/**
 * Copies a batch of Etsy-hosted photos (products, collection covers, review photos) into
 * Supabase Storage and repoints the rows at them, so the shop keeps working if a listing
 * is removed from Etsy. Admin only; the client calls it until nothing is left.
 */
export async function copyEtsyPhotoBatch(): Promise<PhotoMigrationResult> {
  await adminContext();

  const db = createServiceClient();
  if (!db) return { copied: 0, failed: 0, remaining: 0, error: "SUPABASE_SECRET_KEY is not set on the server." };

  const countLeft = async () => {
    const [products, categories, reviews] = await Promise.all([
      db.from("product_images").select("id", { count: "exact", head: true }).is("storage_path", null).like("url", `%${ETSY_HOST}%`),
      db.from("categories").select("slug", { count: "exact", head: true }).like("image_url", `%${ETSY_HOST}%`),
      db.from("reviews").select("id", { count: "exact", head: true }).like("image_url", `%${ETSY_HOST}%`),
    ]);
    return (products.count ?? 0) + (categories.count ?? 0) + (reviews.count ?? 0);
  };

  const store = async (sourceUrl: string, folder: "products" | "reviews") => {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`download failed (${res.status})`);
    const contentType = res.headers.get("content-type");
    const path = `${folder}/${randomUUID()}.${extensionFor(contentType, sourceUrl)}`;
    const { error } = await db.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, await res.arrayBuffer(), {
      contentType: contentType?.split(";")[0] ?? "image/jpeg",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return { path, publicUrl: db.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl };
  };

  let copied = 0;
  let failed = 0;

  const { data: productPhotos } = await db
    .from("product_images")
    .select("id, url")
    .is("storage_path", null)
    .like("url", `%${ETSY_HOST}%`)
    .limit(BATCH);

  for (const photo of productPhotos ?? []) {
    try {
      const { path, publicUrl } = await store(photo.url, "products");
      const { error } = await db.from("product_images").update({ url: publicUrl, storage_path: path }).eq("id", photo.id);
      if (error) throw new Error(error.message);
      copied += 1;
    } catch (e) {
      console.error("[admin/photos]", photo.url, (e as Error).message);
      failed += 1;
    }
  }

  // Collection covers and review photos once the product photos are done.
  if (!productPhotos?.length) {
    const { data: covers } = await db
      .from("categories")
      .select("slug, image_url")
      .like("image_url", `%${ETSY_HOST}%`)
      .limit(BATCH);

    for (const category of covers ?? []) {
      try {
        const { publicUrl } = await store(category.image_url as string, "products");
        const { error } = await db.from("categories").update({ image_url: publicUrl }).eq("slug", category.slug);
        if (error) throw new Error(error.message);
        copied += 1;
      } catch (e) {
        console.error("[admin/photos]", category.image_url, (e as Error).message);
        failed += 1;
      }
    }

    if (!covers?.length) {
      const { data: reviewPhotos } = await db
        .from("reviews")
        .select("id, image_url")
        .like("image_url", `%${ETSY_HOST}%`)
        .limit(BATCH);

      for (const review of reviewPhotos ?? []) {
        try {
          const { publicUrl } = await store(review.image_url as string, "reviews");
          const { error } = await db.from("reviews").update({ image_url: publicUrl }).eq("id", review.id);
          if (error) throw new Error(error.message);
          copied += 1;
        } catch (e) {
          console.error("[admin/photos]", review.image_url, (e as Error).message);
          failed += 1;
        }
      }
    }
  }

  if (copied > 0) {
    updateTag("products");
    updateTag("categories");
    updateTag("reviews");
  }
  return { copied, failed, remaining: await countLeft() };
}
