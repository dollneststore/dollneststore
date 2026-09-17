import type { Metadata } from "next";
import { CheckoutView } from "@/components/cart/checkout-view";
import { container } from "@/components/ui/styles";
import { getSiteSettings, resolveSettings } from "@/lib/data/catalog";
import { fallback } from "@/lib/errors";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  // Checkout must never fail over a settings read: the Etsy link is a nice-to-have.
  const { socials } = await getSiteSettings().catch(fallback(resolveSettings(null), "[checkout] settings"));
  return (
    <div className={`${container} pt-[clamp(28px,4vw,56px)] pb-[clamp(56px,7vw,96px)]`}>
      <h1 className="mb-8 font-serif text-[clamp(38px,5vw,56px)] leading-none font-medium">Checkout</h1>
      <CheckoutView etsyUrl={socials.etsy} />
    </div>
  );
}
