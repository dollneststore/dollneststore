import "server-only";
import Stripe from "stripe";

/**
 * Stripe client. Returns null when the key isn't set, so the shop keeps working
 * (with the WhatsApp route) on an environment that has no Stripe configured yet.
 */
export function createStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

export const isStripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);
