import {
  Collections,
  FaqSection,
  FeaturedBabies,
  GiftOccasions,
  Hero,
  ReviewsSection,
  SocialSection,
  TrustStrip,
  Values,
} from "@/components/home/home-sections";
import { JsonLd } from "@/components/site/json-ld";
import { container } from "@/components/ui/styles";
import { faqs } from "@/lib/content/faq";
import { getCategoriesWithCovers, getFeaturedProducts, getReviews, getShopProducts, getSiteSettings, isForSale } from "@/lib/data/catalog";
import { staticPageMetadata } from "@/lib/seo";
import { isAccessoryProduct, shopPath } from "@/lib/seo-defaults";
import { site } from "@/lib/site";

export function generateMetadata() {
  return staticPageMetadata("/");
}

export default async function HomePage() {
  const [featured, categories, latestReviews, settings, products] = await Promise.all([
    getFeaturedProducts(4),
    getCategoriesWithCovers(),
    getReviews(24),
    getSiteSettings(),
    getShopProducts(),
  ]);

  // Best-rated first, then the ones with a customer photo, then the newest.
  const reviews = [...latestReviews]
    .filter((r) => r.rating >= 4 && r.body.trim().length > 20)
    .sort((a, b) => b.rating - a.rating || Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)))
    .slice(0, 6);

  const fromPrices: Record<string, number> = {};
  for (const p of products) {
    if (!isForSale(p) || !p.categorySlug) continue;
    fromPrices[p.categorySlug] = Math.min(fromPrices[p.categorySlug] ?? Infinity, p.pricePence);
  }

  // Hero and social strip use our own photos from the catalogue (never an external host).
  const gallery = products.filter((p) => !isAccessoryProduct(p) && p.images.length > 0);
  const heroProduct = featured.find((p) => p.images.length > 0) ?? gallery[0];
  const rest = gallery.filter((p) => p.id !== heroProduct?.id);
  const socialImages = rest.slice(0, 5).map((p) => p.images[0].url);
  // Different babies from the ones above, so the page doesn't repeat itself.
  const occasionImages = (rest.length >= 10 ? rest.slice(5, 10) : rest.slice(0, 5)).map((p) => p.images[0].url);

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
      {heroProduct ? (
        <Hero imageUrl={heroProduct.images[0].url} imageAlt={heroProduct.images[0].alt ?? heroProduct.title} />
      ) : null}
      <FeaturedBabies products={featured} />
      <TrustStrip />
      <Collections categories={categories} fromPrices={fromPrices} />
      <GiftOccasions images={occasionImages} />
      <Values />
      <ReviewsSection reviews={reviews} />
      {socialImages.length ? <SocialSection images={socialImages} socials={settings.socials} /> : null}
      <FaqSection />
    </div>
  );
}
