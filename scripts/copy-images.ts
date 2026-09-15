/**
 * Copies product and review photos that are still hosted on Etsy into Supabase Storage,
 * so the shop keeps working if a listing is removed from Etsy.
 *
 *   pnpm copy:images              copy product photos (and review photos)
 *   pnpm copy:images --dry-run    only report what would be copied
 *   pnpm copy:images --products   product photos only
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 * Safe to re-run: rows that already have a storage_path (or a non-Etsy URL) are skipped.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });

const BUCKET = "product-images";
const ETSY_HOST = "i.etsystatic.com";
const CONCURRENCY = 4;
const flags = new Set(process.argv.slice(2));
const DRY_RUN = flags.has("--dry-run");
const PRODUCTS_ONLY = flags.has("--products");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const isEtsy = (value: string | null) => Boolean(value && value.includes(ETSY_HOST));

const extensionFor = (contentType: string | null, source: string) => {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("avif")) return "avif";
  if (source.endsWith(".png")) return "png";
  return "jpg";
};

async function copyToStorage(sourceUrl: string, folder: "products" | "reviews") {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  const contentType = res.headers.get("content-type");
  const path = `${folder}/${randomUUID()}.${extensionFor(contentType, sourceUrl)}`;
  const { error } = await db.storage.from(BUCKET).upload(path, await res.arrayBuffer(), {
    contentType: contentType?.split(";")[0] ?? "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { path, publicUrl: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Runs tasks with a small concurrency limit so Etsy and Supabase aren't hammered. */
async function runAll<T>(items: T[], task: (item: T) => Promise<void>) {
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (index < items.length) {
        const item = items[index++];
        await task(item);
      }
    }),
  );
}

async function main() {
  const { data: images, error } = await db
    .from("product_images")
    .select("id, url, storage_path")
    .is("storage_path", null);
  if (error) throw error;
  const productPhotos = (images ?? []).filter((img) => isEtsy(img.url));
  console.log(`product photos to copy: ${productPhotos.length}`);

  let done = 0;
  let failed = 0;
  if (!DRY_RUN) {
    await runAll(productPhotos, async (img) => {
      try {
        const { path, publicUrl } = await copyToStorage(img.url, "products");
        const { error: updateError } = await db
          .from("product_images")
          .update({ url: publicUrl, storage_path: path })
          .eq("id", img.id);
        if (updateError) throw new Error(updateError.message);
        done += 1;
        if (done % 25 === 0) console.log(`  …${done}/${productPhotos.length}`);
      } catch (e) {
        failed += 1;
        console.error(`  failed: ${img.url} — ${(e as Error).message}`);
      }
    });
    console.log(`✓ product photos copied: ${done}${failed ? `, failed: ${failed}` : ""}`);
  }

  if (PRODUCTS_ONLY) return;

  const { data: reviews, error: reviewError } = await db
    .from("reviews")
    .select("id, image_url")
    .not("image_url", "is", null);
  if (reviewError) throw reviewError;
  const reviewPhotos = (reviews ?? []).filter((r) => isEtsy(r.image_url));
  console.log(`review photos to copy: ${reviewPhotos.length}`);

  if (!DRY_RUN) {
    let reviewsDone = 0;
    await runAll(reviewPhotos, async (review) => {
      try {
        const { publicUrl } = await copyToStorage(review.image_url as string, "reviews");
        const { error: updateError } = await db.from("reviews").update({ image_url: publicUrl }).eq("id", review.id);
        if (updateError) throw new Error(updateError.message);
        reviewsDone += 1;
      } catch (e) {
        console.error(`  failed: ${review.image_url} — ${(e as Error).message}`);
      }
    });
    console.log(`✓ review photos copied: ${reviewsDone}`);
  }

  if (DRY_RUN) console.log("Dry run — nothing was changed.");
  else console.log("Done. Redeploy on Vercel (or wait an hour) for the new image URLs to show.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
