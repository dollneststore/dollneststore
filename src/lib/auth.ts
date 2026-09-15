import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/public";

export type AdminUser = { id: string; email: string };

/**
 * Verifies the session JWT and confirms the user is listed in `public.admins`.
 * Deduplicated per request with React.cache.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id, email")
    .eq("user_id", userId)
    .maybeSingle();
  if (!admin) return null;
  return { id: admin.user_id, email: admin.email };
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
