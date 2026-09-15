import { categoryContent } from "@/lib/content/categories";
import { formatPrice, productMeta } from "@/lib/format";
import type { Category, Guide, Product } from "@/lib/types";

// Pure SEO helpers shared by the storefront and the admin preview (no server imports).

export const SEO_TITLE_LIMIT = 60;
export const SEO_DESCRIPTION_LIMIT = 155;

export const ACCESSORIES_SLUG = "accessories";
export const isAccessoryProduct = (p: Pick<Product, "categorySlug">) => p.categorySlug === ACCESSORIES_SLUG;

export const shopPath = "/reborn-dolls";
export const productPath = (slug: string) => `${shopPath}/${slug}`;
export const categoryPath = (slug: string) => `${shopPath}/${slug}`;
export const guidePath = (slug: string) => `/guides/${slug}`;

export function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

export function defaultProductTitle(title: string, accessory = false) {
  return accessory ? `${title} | Dollnest` : `${title} – Reborn Doll UK | Dollnest`;
}

export function defaultProductDescription(
  p: Pick<Product, "title" | "lengthIn" | "weightLbs" | "categorySlug" | "pricePence">,
) {
  if (isAccessoryProduct(p)) {
    return truncate(
      `${p.title} from Dollnest, a small reborn doll shop in Bristol. ${formatPrice(p.pricePence)} with free tracked UK delivery.`,
      SEO_DESCRIPTION_LIMIT,
    );
  }
  const meta = productMeta(p);
  return truncate(
    `${p.title}${meta ? ` (${meta})` : ""}: a lifelike reborn baby doll dressed in a new outfit. ${formatPrice(p.pricePence)} with free tracked UK delivery.`,
    SEO_DESCRIPTION_LIMIT,
  );
}

export function productSeo(p: Product) {
  return {
    title: p.seoTitle || defaultProductTitle(p.title, isAccessoryProduct(p)),
    description: p.seoDescription || defaultProductDescription(p),
  };
}

export function categoryDefaults(c: Pick<Category, "slug" | "name">) {
  const content = categoryContent[c.slug];
  return {
    heading: content?.heading ?? c.name,
    title: content?.title ?? `${c.name} – Reborn Dolls UK | Dollnest`,
    description:
      content?.description ??
      truncate(`Shop ${c.name.toLowerCase()} from Dollnest, a small UK reborn doll shop in Bristol. Free tracked UK delivery and 14-day returns.`, SEO_DESCRIPTION_LIMIT),
    intro: content?.intro ?? "",
  };
}

export function categorySeo(c: Category) {
  const defaults = categoryDefaults(c);
  return {
    heading: defaults.heading,
    title: c.seoTitle || defaults.title,
    description: c.seoDescription || defaults.description,
    intro: c.intro || defaults.intro,
  };
}

export function defaultGuideTitle(title: string) {
  return `${title} | Dollnest Guides`;
}

export function defaultGuideDescription(g: Pick<Guide, "excerpt" | "body">) {
  const source = g.excerpt || g.body.replace(/[#*_>[\]()`-]/g, " ");
  return truncate(source, SEO_DESCRIPTION_LIMIT);
}

export function guideSeo(g: Guide) {
  return {
    title: g.seoTitle || defaultGuideTitle(g.title),
    description: g.seoDescription || defaultGuideDescription(g),
  };
}
