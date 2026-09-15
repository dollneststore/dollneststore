import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Fixed-window rate limit stored in Postgres (public.hit_rate_limit).
 * Identifiers are hashed, so no raw IPs or emails are stored.
 * Returns true when the request may proceed. Fails open (and logs) if the limiter is unavailable.
 */
export async function allowRequest(scope: string, identifier: string, limit: number, windowSeconds: number) {
  const db = createServiceClient();
  if (!db) return true;
  const key = `${scope}:${createHash("sha256").update(identifier.toLowerCase()).digest("hex").slice(0, 40)}`;
  const { data, error } = await db.rpc("hit_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit]", error.message);
    return true;
  }
  return data === true;
}
