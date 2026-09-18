/**
 * Temporary: says whether each Stripe environment variable reached the running deployment.
 * It reports presence only — never a key, never part of one — so it is safe to call, and it
 * is removed once the integration is confirmed working.
 */
export async function GET() {
  return Response.json({
    STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    STRIPE_WEBHOOK_SECRET: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    // Which mode the keys are for, without revealing them.
    mode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")
      ? "live"
      : process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
        ? "test"
        : "none",
  });
}
