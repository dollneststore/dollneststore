import "server-only";
import type { Metadata } from "next";
import { pageSeoDefaults, type StaticSeoPath } from "@/lib/content/page-seo";
import { getPageSeo } from "@/lib/data/catalog";
import { fallback } from "@/lib/errors";
import { site } from "@/lib/site";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  article?: { publishedTime: string | null; modifiedTime: string | null };
  noIndex?: boolean;
};

/** Full, absolute titles are used everywhere so the admin controls exactly what Google shows. */
export function buildMetadata({ title, description, path, image, article, noIndex }: MetadataInput): Metadata {
  // Falls back to our own logo rather than an external image.
  const images = [{ url: image || site.logo }];
  const shared = { url: path, title, description, siteName: site.name, locale: "en_GB", images };

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: article
      ? {
          ...shared,
          type: "article",
          publishedTime: article.publishedTime ?? undefined,
          modifiedTime: article.modifiedTime ?? undefined,
        }
      : { ...shared, type: "website" },
    twitter: { card: "summary_large_image", title, description, images: images.map((img) => img.url) },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Static pages: a row saved in `page_seo` wins over the defaults in code. */
export async function staticPageMetadata(path: StaticSeoPath): Promise<Metadata> {
  const defaults = pageSeoDefaults[path];
  // Admin SEO overrides are an enhancement: if they can't be read, the page still renders
  // with the defaults in code instead of failing to generate metadata.
  const saved = await getPageSeo(path).catch(fallback(null, `[seo] ${path}`));
  return buildMetadata({
    path,
    title: saved?.title || defaults.title,
    description: saved?.description || defaults.description,
    image: saved?.ogImageUrl,
  });
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site.url}${item.path === "/" ? "" : item.path}`,
    })),
  };
}
