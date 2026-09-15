import "server-only";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Every admin query and action starts here: verify the admin, then use their RLS-bound client. */
export async function adminContext() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  return { admin, supabase };
}
