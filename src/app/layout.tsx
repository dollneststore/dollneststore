import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Dollnest · Reborn baby dolls made with love in the UK",
    template: "%s · Dollnest",
  },
  description: site.description,
  applicationName: site.name,
  keywords: ["reborn dolls UK", "silicone reborn baby", "reborn baby doll", "weighted reborn doll", "Dollnest"],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: site.name,
    url: "/",
    images: [{ url: heroImage, alt: "A sleeping Dollnest reborn baby" }],
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

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
