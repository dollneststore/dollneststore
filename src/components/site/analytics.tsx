"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent";
import { site } from "@/lib/site";

/**
 * Google Analytics, loaded only once the visitor has agreed. Nothing is requested from Google
 * and no analytics cookie is set before then, which is what PECR requires.
 */
export function Analytics() {
  const consent = useConsent();
  if (consent !== "granted" || !site.analyticsId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${site.analyticsId}`} strategy="afterInteractive" />
      <Script id="ga-setup" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${site.analyticsId}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
