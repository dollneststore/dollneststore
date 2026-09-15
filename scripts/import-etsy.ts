/**
 * Imports every active Etsy listing (with all images) and the shop's reviews
 * from the Etsy Open API v3 into Supabase.
 *
 *   pnpm import:etsy                 insert new listings, skip already-imported ones
 *   pnpm import:etsy --update        also refresh title/price/description/stock/images of existing ones
 *   pnpm import:etsy --copy-images   store images in Supabase Storage instead of hotlinking Etsy
 *   pnpm import:etsy --dry-run       only write data/etsy-export.json
 *
 * Needs ETSY_API_KEY (+ ETSY_SHARED_SECRET), NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 * Photos uploaded through the admin panel are never removed.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";

config({ path: ".env.local" });

const SHOP_NAME = process.env.ETSY_SHOP_NAME ?? "DollNestStore";
const BUCKET = "product-images";
const flags = new Set(process.argv.slice(2));
const DRY_RUN = flags.has("--dry-run");
const UPDATE = flags.has("--update");
const COPY_IMAGES = flags.has("--copy-images");

const apiKey = process.env.ETSY_API_KEY;
const sharedSecret = process.env.ETSY_SHARED_SECRET;
if (!apiKey) {
  console.error("Missing ETSY_API_KEY in .env.local (create an app at https://www.etsy.com/developers/your-apps)");
  process.exit(1);
}
const xApiKey = sharedSecret ? `${apiKey}:${sharedSecret}` : apiKey;

type Money = { amount: number; divisor: number; currency_code: string };
type EtsyImage = { listing_image_id: number; url_fullxfull: string; alt_text: string | null; rank: number };
type EtsyListing = {
  listing_id: number;
  title: string;
  description: string;
  price: Money;
  quantity: number;
  url: string;
  images?: EtsyImage[];
};
type EtsyReview = {
  listing_id: number | null;
  transaction_id: number;
  rating: number;
  review: string | null;
  image_url_fullxfull: string | null;
  create_timestamp: number;
};

async function etsy<T>(path: string): Promise<T> {
  const res = await fetch(`https://openapi.etsy.com/v3/application${path}`, {
    headers: { "x-api-key": xApiKey },
  });
  if (!res.ok) throw new Error(`Etsy ${res.status} on ${path}: ${await res.text()}`);
  return (await res.json()) as T;
}

async function paginate<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  const separator = path.includes("?") ? "&" : "?";
  for (let offset = 0; ; offset += 100) {
    const page = await etsy<{ count: number; results: T[] }>(`${path}${separator}limit=100&offset=${offset}`);
    results.push(...page.results);
    if (page.results.length === 0 || results.length >= page.count) break;
  }
  return results;
}

const decode = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function guessCategory(text: string) {
  const t = text.toLowerCase();
  if (/\bmini\b|12 ?inch/.test(t)) return "mini";
  if (t.includes("silicone")) return "silicone";
  if (t.includes("weighted")) return "weighted";
  return "cloth-body";
}

function guessGender(title: string) {
  if (/\bboy\b/i.test(title)) return "boy";
  if (/\bgirl\b/i.test(title)) return "girl";
  return "unisex";
}

function spec(pattern: RegExp, text: string) {
  const match = text.match(pattern);
  return match ? Number(match[1]) : null;
}

async function main() {
  const shops = await etsy<{ results: { shop_id: number; shop_name: string }[] }>(
    `/shops?shop_name=${encodeURIComponent(SHOP_NAME)}`,
  );
  const shop = shops.results.find((s) => s.shop_name.toLowerCase() === SHOP_NAME.toLowerCase());
  if (!shop) throw new Error(`Etsy shop "${SHOP_NAME}" not found`);

  const listings = await paginate<EtsyListing>(`/shops/${shop.shop_id}/listings/active?includes=Images`);
  const reviews = await paginate<EtsyReview>(`/shops/${shop.shop_id}/reviews`);
  console.log(`Found ${listings.length} active listings and ${reviews.length} reviews`);

  await mkdir("data", { recursive: true });
  await writeFile("data/etsy-export.json", JSON.stringify({ shop, listings, reviews }, null, 2));
  if (DRY_RUN) {
    console.log("Dry run — wrote data/etsy-export.json");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: existingRows, error: existingError } = await db
    .from("products")
    .select("id, etsy_listing_id")
    .not("etsy_listing_id", "is", null);
  if (existingError) throw existingError;
  const productIdByListing = new Map(existingRows.map((r) => [r.etsy_listing_id as string, r.id as string]));

  for (const [index, listing] of listings.entries()) {
    const listingId = String(listing.listing_id);
    const existingId = productIdByListing.get(listingId);
    if (existingId && !UPDATE) continue;

    const title = decode(listing.title).slice(0, 140);
    const description = decode(listing.description);
    const common = {
      title,
      description,
      price_pence: Math.round((listing.price.amount / listing.price.divisor) * 100),
      stock_qty: Math.max(0, listing.quantity),
    };

    let productId: string;
    if (existingId) {
      // Update only Etsy-owned fields; slug, collection, badge and SEO stay as edited in the admin.
      const { error } = await db.from("products").update(common).eq("id", existingId);
      if (error) throw error;
      productId = existingId;
    } else {
      const base = slugify(title).split("-").slice(0, 6).join("-") || "reborn-doll";
      const { data, error } = await db
        .from("products")
        .insert({
          ...common,
          etsy_listing_id: listingId,
          slug: `${base}-${listingId.slice(-4)}`,
          category_slug: guessCategory(`${title} ${description}`),
          gender: guessGender(title),
          length_in: spec(/(\d{1,2})\s*(?:inch|in\b|")/i, description),
          weight_lbs: spec(/(\d{1,2}(?:\.\d)?)\s*lbs?/i, description),
          status: "active",
          sort_order: 100 + index,
        })
        .select("id")
        .single();
      if (error) throw error;
      productId = data.id;
      productIdByListing.set(listingId, productId);
    }

    // Replace only images that came from Etsy (hotlinked or copied with an etsy- prefix).
    const { data: oldEtsyImages } = await db
      .from("product_images")
      .select("id, storage_path")
      .eq("product_id", productId)
      .or("storage_path.is.null,storage_path.like.products/etsy-%");
    if (oldEtsyImages?.length) {
      await db.from("product_images").delete().in("id", oldEtsyImages.map((img) => img.id));
    }

    const images = [...(listing.images ?? [])].sort((a, b) => a.rank - b.rank);
    const imageRows = [];
    for (const [position, image] of images.entries()) {
      let imageUrl = image.url_fullxfull;
      let storagePath: string | null = null;
      if (COPY_IMAGES) {
        const res = await fetch(image.url_fullxfull);
        if (!res.ok) throw new Error(`Image download failed: ${image.url_fullxfull}`);
        storagePath = `products/etsy-${image.listing_image_id}.jpg`;
        const { error: uploadError } = await db.storage
          .from(BUCKET)
          .upload(storagePath, await res.arrayBuffer(), { contentType: "image/jpeg", upsert: true });
        if (uploadError) throw uploadError;
        imageUrl = db.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
      }
      imageRows.push({
        product_id: productId,
        url: imageUrl,
        storage_path: storagePath,
        alt: image.alt_text || title,
        position,
      });
    }
    if (imageRows.length) {
      const { error: imageError } = await db.from("product_images").insert(imageRows);
      if (imageError) throw imageError;
    }
    console.log(`${existingId ? "↻" : "✓"} ${title} (${imageRows.length} images)`);
  }

  const reviewRows = reviews
    .filter((r) => r.review?.trim())
    .map((r) => ({
      external_id: `etsy-${r.transaction_id}`,
      author_name: "Etsy buyer",
      rating: r.rating,
      body: decode(r.review!.trim()).slice(0, 2000),
      source: "etsy",
      image_url: r.image_url_fullxfull,
      product_id: r.listing_id ? (productIdByListing.get(String(r.listing_id)) ?? null) : null,
      is_published: r.rating >= 4,
      reviewed_at: new Date(r.create_timestamp * 1000).toISOString().slice(0, 10),
    }));
  if (reviewRows.length) {
    const { error } = await db.from("reviews").upsert(reviewRows, { onConflict: "external_id" });
    if (error) throw error;
  }
  console.log(`✓ ${reviewRows.length} reviews with text imported`);
  console.log("Done. Open /admin/products to review categories, names and featured babies.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
