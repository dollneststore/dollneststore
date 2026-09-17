"use server";

import { z } from "zod";
import { DISCOUNT_CODE_PATTERN } from "@/lib/admin/validation";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createPublicClient } from "@/lib/supabase/public";

export type DiscountState = { ok: boolean; message: string; code?: string; percentOff?: number } | null;

const schema = z.string().trim().toUpperCase().regex(DISCOUNT_CODE_PATTERN);

/**
 * Checks a discount code typed by a customer. The codes table has no public read policy:
 * check_discount_code() returns the one matching code or nothing, so codes can't be listed,
 * and the attempts are rate limited so they can't be guessed in bulk.
 *
 * The percentage returned here is for display. When Stripe goes live the checkout must
 * re-check the code and recompute the total on the server before taking any money.
 */
export async function applyDiscountCode(_prev: DiscountState, formData: FormData): Promise<DiscountState> {
  const parsed = schema.safeParse(String(formData.get("code") ?? ""));
  if (!parsed.success) return { ok: false, message: "Enter your discount code." };

  // Fails closed: without a working limiter, codes could be guessed without any brake.
  // 40 an hour: enough for a shopper whose basket re-checks their code on each visit,
  // far too slow to guess one.
  if ((await checkRateLimit("discount", await clientIp(), 40, 60 * 60)) !== "allowed") {
    return { ok: false, message: "Too many tries from this connection. Please try again later." };
  }

  const db = createPublicClient();
  if (!db) return { ok: false, message: "Discount codes aren't available right now." };

  const { data, error } = await db.rpc("check_discount_code", { p_code: parsed.data });
  if (error) {
    console.error("[discount]", error.message);
    return { ok: false, message: "We couldn't check that code. Please try again." };
  }

  const row = (Array.isArray(data) ? data[0] : data) as { code: string; percent_off: number } | undefined;
  // Deliberately the same wording for unknown, switched-off, expired and not-yet-started codes,
  // so nobody can tell from the reply which codes exist.
  if (!row) return { ok: false, message: "Sorry, we can't use that code." };

  return { ok: true, message: `${row.percent_off}% off applied ♡`, code: row.code, percentOff: row.percent_off };
}
