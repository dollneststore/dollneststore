import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { staticPageMetadata } from "@/lib/seo";
import { site, whatsappUrl } from "@/lib/site";

export function generateMetadata() {
  return staticPageMetadata("/delivery-returns");
}

export default function DeliveryReturnsPage() {
  return (
    <LegalPage title="Delivery & returns" updated="15 September 2026">
      <h2>Delivery</h2>
      <ul>
        <li>Delivery is <strong>free and tracked</strong> on every order.</li>
        <li>Ready-to-post babies are dispatched {site.delivery.dispatch} (Monday to Friday, excluding bank holidays).</li>
        <li>Most parcels arrive in {site.delivery.arrives}. You&apos;ll receive a tracking number once your baby is on the way.</li>
        <li>We currently deliver to addresses in the United Kingdom only.</li>
      </ul>

      <h2>Changed your mind? 14-day cancellation</h2>
      <p>
        Under the Consumer Contracts Regulations 2013 you can cancel your order for any reason within 14 days of the
        day your baby is delivered. To cancel, simply tell us by{" "}
        <a href={whatsappUrl("Hi Dollnest, I'd like to return my order.")} target="_blank" rel="noopener noreferrer">WhatsApp</a>{" "}
        or email at <a href={`mailto:${site.email}`}>{site.email}</a> with your order details.
      </p>
      <ul>
        <li>Please send the doll back within 14 days of telling us, unused and in its original condition and packaging.</li>
        <li>Return postage is paid by you unless the item is faulty or not as described. We recommend a tracked service.</li>
        <li>We refund the price paid, including the original delivery charge (if any), within 14 days of receiving the return.</li>
        <li>Refunds go back to your original payment method.</li>
      </ul>

      <h2>Damaged or faulty items</h2>
      <p>
        If your baby arrives damaged or not as described, message us with a photo within 14 days and we&apos;ll arrange
        a replacement or full refund, including return postage. This doesn&apos;t affect your statutory rights under the
        Consumer Rights Act 2015.
      </p>

      <h2>Questions</h2>
      <p>
        We&apos;re always happy to help — see our <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
