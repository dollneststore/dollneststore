import type { NextConfig } from "next";
import { legacyProductRedirects } from "./src/lib/legacy-redirects";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : null;
const isDev = process.env.NODE_ENV !== "production";

// Next.js injects inline bootstrap scripts, so script-src needs 'unsafe-inline'
// unless every page opts into nonce-based (fully dynamic) rendering.
// Stripe hosts are allowed ahead of the checkout launch.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self' https://api.stripe.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com${supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : ""}`,
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self "https://js.stripe.com")',
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Only our own storage: every photo was copied here, and the admin panel no longer
    // accepts an Etsy link, so the door stays shut.
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
  // Old /shop URLs → keyword-rich /reborn-dolls URLs, and the first import's
  // product URLs → the named ones (permanent, keeps any SEO value).
  async redirects() {
    return [
      {
        source: "/shop",
        has: [{ type: "query", key: "category", value: "(?<category>[a-z0-9-]+)" }],
        destination: "/reborn-dolls/:category",
        permanent: true,
      },
      { source: "/shop", destination: "/reborn-dolls", permanent: true },
      { source: "/shop/:slug", destination: "/reborn-dolls/:slug", permanent: true },
      ...legacyProductRedirects.map(({ from, to }) => ({
        source: `/reborn-dolls/${from}`,
        destination: `/reborn-dolls/${to}`,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
