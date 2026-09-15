import type { Metadata } from "next";
import {
  Collections,
  FaqSection,
  FeaturedBabies,
  Hero,
  ReviewsSection,
  SocialSection,
  TrustStrip,
  Values,
} from "@/components/home/home-sections";
import { JsonLd } from "@/components/site/json-ld";
import { container } from "@/components/ui/styles";
import { faqs } from "@/lib/content/faq";
import { getCategories, getFeaturedProducts, getReviews, getShopProducts, getSiteSettings } from "@/lib/data/catalog";
import { heroImage, seedSocialImages } from "@/lib/data/seed";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, categories, reviews, settings, products] = await Promise.all([
    getFeaturedProducts(4),
    getCategories(),
    getReviews(3),
    getSiteSettings(),
    getShopProducts(),
  ]);

  const fromPrices: Record<string, number> = {};
  for (const p of products) {
    if (p.status !== "active" || !p.categorySlug) continue;
    fromPrices[p.categorySlug] = Math.min(fromPrices[p.categorySlug] ?? Infinity, p.pricePence);
  }

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    legalName: site.company.legalName,
    url: site.url,
    logo: `${site.url}${site.logo}`,
    email: site.email,
    telephone: `+${site.whatsapp.number}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.company.address.street,
      addressLocality: site.company.address.city,
      postalCode: site.company.address.postcode,
      addressCountry: "GB",
    },
    sameAs: Object.values(settings.socials),
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className={container}>
      <JsonLd data={organization} />
      <JsonLd data={faqPage} />
      <Hero imageUrl={heroImage} />
      <FeaturedBabies products={featured} />
      <TrustStrip />
      <Collections categories={categories} fromPrices={fromPrices} />
      <Values />
      <ReviewsSection reviews={reviews} />
      <SocialSection images={seedSocialImages} socials={settings.socials} />
      <FaqSection />
    </div>
  );
}
