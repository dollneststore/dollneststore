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
import { getCategories, getFeaturedProducts, getReviews, getShopProducts, getSiteSettings, isForSale } from "@/lib/data/catalog";
import { heroImage, seedSocialImages } from "@/lib/data/seed";
import { staticPageMetadata } from "@/lib/seo";
import { shopPath } from "@/lib/seo-defaults";
import { site } from "@/lib/site";

export function generateMetadata() {
  return staticPageMetadata("/");
}

export default async function HomePage() {
  const [featured, categories, latestReviews, settings, products] = await Promise.all([
    getFeaturedProducts(4),
    getCategories(),
    getReviews(24),
    getSiteSettings(),
    getShopProducts(),
  ]);

  // Best-rated first, then the ones with a customer photo, then the newest.
  const reviews = [...latestReviews]
    .filter((r) => r.rating >= 4 && r.body.trim().length > 20)
    .sort((a, b) => b.rating - a.rating || Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)))
    .slice(0, 3);

  const fromPrices: Record<string, number> = {};
  for (const p of products) {
    if (!isForSale(p) || !p.categorySlug) continue;
    fromPrices[p.categorySlug] = Math.min(fromPrices[p.categorySlug] ?? Infinity, p.pricePence);
  }

  const organization = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: site.name,
    legalName: site.company.legalName,
    url: site.url,
    logo: `${site.url}${site.logo}`,
    email: site.email,
    telephone: `+${site.whatsapp.number}`,
    identifier: { "@type": "PropertyValue", propertyID: "Companies House", value: site.company.number },
    address: {
      "@type": "PostalAddress",
      streetAddress: site.company.address.street,
      addressLocality: site.company.address.city,
      postalCode: site.company.address.postcode,
      addressCountry: "GB",
    },
    areaServed: "GB",
    sameAs: Object.values(settings.socials).filter(Boolean),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}${shopPath}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
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
      <JsonLd data={website} />
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
