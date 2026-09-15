"use server";

import { z } from "zod";
import { allowRequest, clientIp } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";

export type NewsletterState = { ok: boolean; message: string } | null;

const schema = z.object({ email: z.email().max(254) });

export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Honeypot: real visitors never fill this hidden field.
  if (formData.get("company")) return { ok: true, message: "Thank you ♡" };

  const parsed = schema.safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };

  const db = createServiceClient();
  if (!db) return { ok: false, message: "Sign-ups open very soon — please try again later." };

  if (!(await allowRequest("newsletter", await clientIp(), 5, 60 * 60))) {
    return { ok: false, message: "Too many sign-ups from this connection. Please try again later." };
  }

  // Upsert so someone who unsubscribed earlier can join again.
  const { error } = await db
    .from("newsletter_subscribers")
    .upsert(
      { email: parsed.data.email, consented_at: new Date().toISOString(), unsubscribed_at: null },
      { onConflict: "email" },
    );
  if (error) {
    console.error("[newsletter]", error.message);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
  return { ok: true, message: "You're on the list ♡ Look out for our little letters." };
}
