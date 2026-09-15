/**
 * Seeds Supabase with the starter catalogue (categories, products, reviews).
 *
 *   pnpm db:seed
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 * Safe to re-run: rows are upserted by slug / Etsy listing id / external id.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { seedCategories, seedProducts, seedReviews } from "../src/lib/data/seed";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { error: categoryError } = await db.from("categories").upsert(
    seedCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      image_url: c.imageUrl,
      tint: c.tint,
      sort_order: c.sortOrder,
    })),
    { onConflict: "slug" },
  );
  if (categoryError) throw categoryError;
  console.log(`✓ ${seedCategories.length} categories`);

  for (const p of seedProducts) {
    const { data, error } = await db
      .from("products")
      .upsert(
        {
          slug: p.slug,
          title: p.title,
          description: p.description,
          price_pence: p.pricePence,
          compare_at_price_pence: p.compareAtPricePence,
          category_slug: p.categorySlug,
          gender: p.gender,
          length_in: p.lengthIn,
          weight_lbs: p.weightLbs,
          stock_qty: p.stockQty,
          status: p.status,
          is_featured: p.isFeatured,
          badge: p.badge,
          sort_order: p.sortOrder,
          etsy_listing_id: p.etsyListingId,
        },
        { onConflict: "etsy_listing_id" },
      )
      .select("id")
      .single();
    if (error) throw error;

    // Replace hotlinked images only; images uploaded through the admin panel stay.
    await db.from("product_images").delete().eq("product_id", data.id).is("storage_path", null);
    const { error: imageError } = await db.from("product_images").insert(
      p.images.map((img, position) => ({ product_id: data.id, url: img.url, alt: img.alt, position })),
    );
    if (imageError) throw imageError;
    console.log(`✓ ${p.title}`);
  }

  const { error: reviewError } = await db.from("reviews").upsert(
    seedReviews.map((r) => ({
      external_id: r.id,
      author_name: r.authorName,
      rating: r.rating,
      body: r.body,
      source: r.source,
      image_url: r.imageUrl,
      reviewed_at: r.reviewedAt,
      is_published: true,
    })),
    { onConflict: "external_id" },
  );
  if (reviewError) throw reviewError;
  console.log(`✓ ${seedReviews.length} reviews`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
