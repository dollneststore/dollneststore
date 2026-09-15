import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { staticPageMetadata } from "@/lib/seo";
import { addressLine, site } from "@/lib/site";

export function generateMetadata() {
  return staticPageMetadata("/terms");
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms & conditions" updated="15 September 2026">
      <h2>About us</h2>
      <p>
        dollneststore.co.uk is operated by {site.company.legalName}, a company registered in {site.company.jurisdiction}{" "}
        (company number {site.company.number}), registered office: {addressLine}. Contact us at{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> or on WhatsApp {site.whatsapp.display}.
      </p>

      <h2>Our dolls</h2>
      <ul>
        <li>Reborn dolls are collectible, lifelike dolls. Photos are of the actual baby or an identical model; colours can look slightly different on screens.</li>
        <li>Outfits are brand new and similar to those pictured, but individual items can vary.</li>
        <li>Our dolls are not suitable for children under 3 years. Full silicone babies are collectors&apos; items best suited to ages 8+ with adult supervision.</li>
      </ul>

      <h2>Prices & payment</h2>
      <p>
        All prices are in pounds sterling (GBP) and include delivery to UK addresses. The price you pay is the price shown
        when you place your order. Payment is taken when your order is confirmed.
      </p>

      <h2>Your order</h2>
      <p>
        Your order is an offer to buy. A contract is formed when we confirm your order by email or message. If a baby is
        no longer available we&apos;ll let you know and refund any payment in full.
      </p>

      <h2>Delivery, cancellation & returns</h2>
      <p>
        Please see <Link href="/delivery-returns">Delivery & returns</Link>, which forms part of these terms. You have a
        legal right to cancel within 14 days of delivery.
      </p>

      <h2>Your statutory rights</h2>
      <p>
        Nothing in these terms affects your rights under the Consumer Rights Act 2015. Goods must be as described, fit for
        purpose and of satisfactory quality. If they are not, you may be entitled to a repair, replacement or refund.
      </p>

      <h2>Law</h2>
      <p>
        These terms are governed by the law of England and Wales. If you live in Scotland or Northern Ireland you may also
        bring proceedings in your local courts.
      </p>
    </LegalPage>
  );
}
