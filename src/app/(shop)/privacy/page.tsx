import Link from "next/link";
import { LegalPage } from "@/components/site/legal-page";
import { staticPageMetadata } from "@/lib/seo";
import { addressLine, site } from "@/lib/site";

export function generateMetadata() {
  return staticPageMetadata("/privacy");
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="15 September 2026">
      <p>
        This policy explains how {site.company.legalName} (&quot;Dollnest&quot;, &quot;we&quot;, &quot;us&quot;) collects and uses
        your personal data when you visit dollneststore.co.uk, place an order or contact us. We are the data controller
        and are registered in {site.company.jurisdiction} (company number {site.company.number}), registered office:{" "}
        {addressLine}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Order details</strong> — name, delivery address, email, phone number and what you bought.</li>
        <li><strong>Messages</strong> — anything you send us by WhatsApp, email or social media.</li>
        <li><strong>Newsletter</strong> — your email address and when you signed up, if you choose to join.</li>
        <li><strong>Technical data</strong> — basic server logs (such as IP address and browser) kept by our hosting provider for security.</li>
      </ul>
      <p>Card details are handled by our payment provider and never stored on our systems.</p>

      <h2>Why we use it (lawful basis)</h2>
      <ul>
        <li>To take, deliver and support your order — <em>performance of a contract</em>.</li>
        <li>To keep accounting records — <em>legal obligation</em> (HMRC requires records for 6 years).</li>
        <li>To send our newsletter — <em>consent</em>, which you can withdraw at any time.</li>
        <li>To keep the website secure and prevent fraud — <em>legitimate interests</em>.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We only share what is needed with trusted service providers acting on our instructions:</p>
      <ul>
        <li>Vercel (website hosting) and Supabase (secure database).</li>
        <li>Stripe (payment processing), once online checkout is live.</li>
        <li>Delivery companies, to get your parcel to you.</li>
        <li>WhatsApp / Meta, if you choose to message us there.</li>
      </ul>
      <p>
        Some providers may process data outside the UK. Where they do, transfers are protected by UK adequacy
        regulations or the UK International Data Transfer Agreement / Addendum.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Order records are kept for 6 years for tax purposes. Newsletter data is kept until you unsubscribe. Messages
        are kept for as long as needed to help you, and no longer than 2 years.
      </p>

      <h2>Your rights</h2>
      <p>
        Under UK GDPR you can ask to access, correct, delete or restrict use of your data, object to processing, and ask
        for a copy in a portable format. Email <a href={`mailto:${site.email}`}>{site.email}</a> and we&apos;ll respond
        within one month.
      </p>
      <p>
        If you&apos;re unhappy with how we handle your data you can complain to the Information Commissioner&apos;s Office at{" "}
        <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        See our <Link href="/cookies">cookie policy</Link>.
      </p>
    </LegalPage>
  );
}
