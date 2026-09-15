import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for public catalogue reads.
 * Safe inside `"use cache"` scopes because it never touches request data.
 * Returns null when Supabase is not configured (the storefront then uses seed data).
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export const PRODUCT_IMAGES_BUCKET = "product-images";
