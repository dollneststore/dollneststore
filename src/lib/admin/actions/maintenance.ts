"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { z } from "zod";
import { adminContext } from "@/lib/admin/context";
import { SLUG_PATTERN } from "@/lib/admin/validation";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/service";

const ETSY_HOST = "i.etsystatic.com";
// Small batches keep every request well inside the serverless time limit.
const BATCH = 4;
// The storage bucket only accepts these; anything else is stored as JPEG.
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** A photo that could not be copied. The panel sends these back so we stop retrying them. */
export type StuckPhoto = { kind: "image" | "category" | "review"; id: string };

export type PhotoMigrationResult = {
  copied: number;
  /** Photos attempted in this batch that could not be copied (deleted listing, unreadable file…). */
  stuck: StuckPhoto[];
  /** Rows still holding an Etsy URL — including the stuck ones. */
  remaining: number;
  error?: string;
};

const skipSchema = z.object({
  image: z.array(z.uuid()).max(500),
  category: z.array(z.string().max(60).regex(SLUG_PATTERN)).max(500),
  review: z.array(z.uuid()).max(500),
});

export type PhotoMigrationSkip = z.infer<typeof skipSchema>;

function typeAndExtension(contentType: string | null, source: string) {
  const declared = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (IMAGE_TYPES[declared]) return { type: declared, ext: IMAGE_TYPES[declared] };
  if (source.endsWith(".png")) return { type: "image/png", ext: "png" };
  if (source.endsWith(".webp")) return { type: "image/webp", ext: "webp" };
  return { type: "image/jpeg", ext: "jpg" };
}

/**
 * Copies a batch of Etsy-hosted photos (products, collection covers, review photos) into
 * Supabase Storage and repoints the rows at them, so the shop keeps working if a listing
 * is removed from Etsy. Admin only; the panel calls it until nothing copyable is left.
 *
 * Photos that can't be copied are returned as `stuck`; the panel passes them back in `skip`
 * so a permanently dead photo is attempted once and then never blocks or re-counts.
 */
export async function copyEtsyPhotoBatch(skipInput: unknown = {}): Promise<PhotoMigrationResult> {
  await adminContext();

  const parsed = skipSchema.safeParse({ image: [], category: [], review: [], ...(skipInput as object) });
  if (!parsed.success) return { copied: 0, stuck: [], remaining: 0, error: "Could not read the list of skipped photos." };
  const skip = parsed.data;

  const db = createServiceClient();
  if (!db) return { copied: 0, stuck: [], remaining: 0, error: "SUPABASE_SECRET_KEY is not set on the server." };

  const quoted = (values: string[]) => `(${values.map((v) => `"${v}"`).join(",")})`;

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
    const { type, ext } = typeAndExtension(res.headers.get("content-type"), sourceUrl);
    const path = `${folder}/${randomUUID()}.${ext}`;
    const { error } = await db.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, await res.arrayBuffer(), {
      contentType: type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return { path, publicUrl: db.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl };
  };

  /** Uploads the photo, then points the row at it. Any failure removes the upload again. */
  const move = async (
    sourceUrl: string,
    folder: "products" | "reviews",
    save: (stored: { path: string; publicUrl: string }) => PromiseLike<{ error: { message: string } | null }>,
  ) => {
    const stored = await store(sourceUrl, folder);
    try {
      const { error } = await save(stored);
      if (error) throw new Error(error.message);
    } catch (e) {
      await db.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .remove([stored.path])
        .catch(() => {});
      throw e;
    }
  };

  let copied = 0;
  const stuck: StuckPhoto[] = [];
  const record = (kind: StuckPhoto["kind"], id: string, source: string, e: unknown) => {
    console.error("[admin/photos]", source, (e as Error).message);
    stuck.push({ kind, id });
  };

  const imageQuery = db.from("product_images").select("id, url").is("storage_path", null).like("url", `%${ETSY_HOST}%`);
  if (skip.image.length) imageQuery.not("id", "in", quoted(skip.image));
  const { data: productPhotos } = await imageQuery.limit(BATCH);

  for (const photo of productPhotos ?? []) {
    try {
      await move(photo.url, "products", ({ path, publicUrl }) =>
        db.from("product_images").update({ url: publicUrl, storage_path: path }).eq("id", photo.id),
      );
      copied += 1;
    } catch (e) {
      record("image", photo.id, photo.url, e);
    }
  }

  // Covers and review photos: also reached when the product batch copied nothing,
  // so an uncopyable product photo can never hold up the rest.
  if (!productPhotos?.length || copied === 0) {
    const coverQuery = db.from("categories").select("slug, image_url").like("image_url", `%${ETSY_HOST}%`);
    if (skip.category.length) coverQuery.not("slug", "in", quoted(skip.category));
    const { data: covers } = await coverQuery.limit(BATCH);

    for (const category of covers ?? []) {
      try {
        await move(category.image_url as string, "products", ({ publicUrl }) =>
          db.from("categories").update({ image_url: publicUrl }).eq("slug", category.slug),
        );
        copied += 1;
      } catch (e) {
        record("category", category.slug, category.image_url as string, e);
      }
    }

    const reviewQuery = db.from("reviews").select("id, image_url").like("image_url", `%${ETSY_HOST}%`);
    if (skip.review.length) reviewQuery.not("id", "in", quoted(skip.review));
    const { data: reviewPhotos } = await reviewQuery.limit(BATCH);

    for (const review of reviewPhotos ?? []) {
      try {
        await move(review.image_url as string, "reviews", ({ publicUrl }) =>
          db.from("reviews").update({ image_url: publicUrl }).eq("id", review.id),
        );
        copied += 1;
      } catch (e) {
        record("review", review.id, review.image_url as string, e);
      }
    }
  }

  if (copied > 0) {
    updateTag("products");
    updateTag("categories");
    updateTag("reviews");
  }
  return { copied, stuck, remaining: await countLeft() };
}
