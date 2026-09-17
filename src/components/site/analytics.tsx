"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "@/lib/consent";
import { site } from "@/lib/site";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics with Google's consent mode.
 *
 * The tag is on every page — so Google can see it is installed — but it starts with every
 * storage type denied: no analytics cookie is written and no identifier is kept until the
 * visitor agrees on the banner. Answering the banner updates the tag in place.
 *
 * The defaults and the config are pushed from one inline script, before the library is
 * fetched, because consent mode only works if "denied" is set first.
 */
export function Analytics() {
  const consent = useConsent();

  useEffect(() => {
    if (consent === null || !site.analyticsId) return;
    window.gtag?.("consent", "update", {
      analytics_storage: consent === "granted" ? "granted" : "denied",
    });
  }, [consent]);

  if (!site.analyticsId) return null;

  return (
    <Script id="ga-consent-mode" strategy="afterInteractive">
      {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
try {
  if (window.localStorage.getItem('dollnest.consent.v1') === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
} catch (e) {}
gtag('js', new Date());
gtag('config', '${site.analyticsId}', { anonymize_ip: true });
var s = document.createElement('script');
s.async = true;
s.src = 'https://www.googletagmanager.com/gtag/js?id=${site.analyticsId}';
document.head.appendChild(s);`}
    </Script>
  );
}
