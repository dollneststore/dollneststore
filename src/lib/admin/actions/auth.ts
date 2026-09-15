"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/admin/form-state";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(200),
  next: z.string().max(200),
});

function safeNext(next: string) {
  return /^\/admin(\/[\w\-/?=&.]*)?$/.test(next) && !next.startsWith("/admin/login") ? next : "/admin";
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase is not configured yet." };

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Enter your email and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Same message for unknown email and wrong password to avoid account enumeration.
  if (error || !data.user) return { ok: false, message: "Email or password is incorrect." };

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { ok: false, message: "This account doesn't have admin access." };
  }

  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
