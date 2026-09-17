import { ConsentChoice } from "@/components/site/consent-banner";
import { LegalPage } from "@/components/site/legal-page";
import { staticPageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return staticPageMetadata("/cookies");
}

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie policy" updated="17 September 2026">
      <p>
        We use no advertising cookies at all. We do use Google Analytics to understand which babies people look at — but
        it stores nothing on your device until you say yes. The Google tag is present on every page so that Google can
        confirm it is installed correctly, and it starts switched to &quot;denied&quot;: no analytics cookie is written
        and no identifier is kept about you. Until you answer, Google receives only a basic signal that a page was
        viewed, with no cookie and a shortened IP address. Saying no changes nothing about how the shop works.
      </p>

      <h2>Your choice</h2>
      <p>You can change your mind here at any time:</p>
      <ConsentChoice />

      <h2>Analytics cookies (only with your agreement)</h2>
      <ul>
        <li>
          <strong>_ga</strong> — tells Google Analytics one visit apart from another. Lasts up to 2 years.
        </li>
        <li>
          <strong>_ga_QDZ4PQH090</strong> — keeps your session together while you browse. Lasts up to 2 years.
        </li>
      </ul>
      <p>
        These are set by Google on our behalf and we see only grouped statistics: pages viewed, roughly where visitors
        came from, and which devices they use. We ask Google to shorten IP addresses, and we never use this data to try
        to identify you personally. If you choose no, or never answer, these cookies are never set — and if you switch
        analytics off after allowing it, the tag stops storing anything from that moment.
      </p>

      <h2>What we store on your device without asking</h2>
      <p>These are strictly necessary for things you asked for, so UK law does not require consent for them:</p>
      <ul>
        <li>
          <strong>Your basket</strong> is saved in your browser&apos;s local storage so it&apos;s still there when you come
          back. It never leaves your device until you check out.
        </li>
        <li>
          <strong>Your discount code</strong> is saved in local storage too, so it&apos;s still applied when you move from
          your basket to checkout.
        </li>
        <li>
          <strong>Your answer to this cookie question</strong>, so we don&apos;t ask again on every page.
        </li>
        <li>
          <strong>Whether you&apos;ve seen our welcome offer</strong>, so it doesn&apos;t appear again for 30 days.
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
      <p>Clearing your browser data removes all of these, including your cookie choice.</p>

      <h2>Changes</h2>
      <p>
        If we ever add marketing or advertising tools we&apos;ll update this page and ask for your permission first, as
        required by the Privacy and Electronic Communications Regulations (PECR).
      </p>
    </LegalPage>
  );
}
