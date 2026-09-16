import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { pageSeoDefaults } from "@/lib/content/page-seo";
import { getFeaturedProducts, getSiteSettings } from "@/lib/data/catalog";
import { site } from "@/lib/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [{ googleSiteVerification }, featured] = await Promise.all([getSiteSettings(), getFeaturedProducts(1)]);
  const home = pageSeoDefaults["/"];
  // Share image comes from our own catalogue photo, falling back to the logo.
  const shareImage = featured[0]?.images[0];

  return {
    metadataBase: new URL(site.url),
    title: { default: home.title, template: "%s | Dollnest" },
    description: home.description,
    applicationName: site.name,
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: site.name,
      url: "/",
      images: [{ url: shareImage?.url ?? site.logo, alt: shareImage?.alt ?? "A Dollnest reborn baby" }],
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
    ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#fdf6f8",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" data-scroll-behavior="smooth" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
