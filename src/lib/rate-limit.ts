import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export type RateLimitStatus = "allowed" | "blocked" | "unavailable";

/**
 * Fixed-window rate limit stored in Postgres (public.hit_rate_limit).
 * Identifiers are hashed, so no raw IPs or emails are stored.
 * Reports "unavailable" when the limiter itself can't be reached, so each caller
 * decides whether that should pass or block.
 */
export async function checkRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitStatus> {
  const db = createServiceClient();
  if (!db) return "unavailable";
  const key = `${scope}:${createHash("sha256").update(identifier.toLowerCase()).digest("hex").slice(0, 40)}`;
  const { data, error } = await db.rpc("hit_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit]", error.message);
    return "unavailable";
  }
  return data === true ? "allowed" : "blocked";
}

/** Returns true when the request may proceed. Fails open (and logs) if the limiter is unavailable. */
export async function allowRequest(scope: string, identifier: string, limit: number, windowSeconds: number) {
  return (await checkRateLimit(scope, identifier, limit, windowSeconds)) !== "blocked";
}
