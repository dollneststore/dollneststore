import { LegalPage } from "@/components/site/legal-page";
import { staticPageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return staticPageMetadata("/cookies");
}

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie policy" updated="15 September 2026">
      <p>
        We keep things simple: dollneststore.co.uk does <strong>not</strong> use advertising or analytics cookies, so we
        don&apos;t need to ask for your consent.
      </p>

      <h2>What we store on your device</h2>
      <ul>
        <li>
          <strong>Your basket</strong> is saved in your browser&apos;s local storage so it&apos;s still there when you come
          back. It never leaves your device until you check out.
        </li>
        <li>
          <strong>Security cookies</strong> are set only when our team signs in to the shop&apos;s admin area. They are
          strictly necessary and aren&apos;t used for visitors.
        </li>
        <li>
          <strong>Payment cookies</strong> may be set by Stripe during checkout (once live) to prevent fraud. These are
          strictly necessary for payment.
        </li>
      </ul>

      <h2>Changes</h2>
      <p>
        If we ever add analytics or marketing tools we&apos;ll update this page and ask for your permission first, as
        required by the Privacy and Electronic Communications Regulations (PECR).
      </p>
    </LegalPage>
  );
}
