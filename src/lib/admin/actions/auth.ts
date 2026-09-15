"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/admin/form-state";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
  next: z.string().max(200),
});

const INVALID = { ok: false, message: "Email or password is incorrect." } as const;

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

  // Supabase sees Vercel's IPs, not the visitor's, so throttle here per IP and per account.
  const [ipAllowed, emailAllowed] = await Promise.all([
    allowRequest("login-ip", await clientIp(), 20, 15 * 60),
    allowRequest("login-email", parsed.data.email, 8, 15 * 60),
  ]);
  if (!ipAllowed || !emailAllowed) {
    return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Same message for unknown email, wrong password and non-admin accounts (no credential oracle).
  if (error || !data.user) return INVALID;

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return INVALID;
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
