import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { pageSeoDefaults } from "@/lib/content/page-seo";
import { getSiteSettings } from "@/lib/data/catalog";
import { heroImage } from "@/lib/data/seed";
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
  const { googleSiteVerification } = await getSiteSettings();
  const home = pageSeoDefaults["/"];

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
      images: [{ url: heroImage, alt: "A sleeping Dollnest reborn baby" }],
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
