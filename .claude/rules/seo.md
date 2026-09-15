# SEO rules

- URL structure is fixed: `/reborn-dolls` (all), `/reborn-dolls/<collection>`, `/reborn-dolls/<product>`, `/guides/<guide>`. Never change a live URL without adding a 301 in `next.config.ts` → `redirects()`.
- Product and collection slugs share one namespace; both admin actions check for clashes.
- Every page gets metadata through `src/lib/seo.ts`: `staticPageMetadata(path)` for fixed pages (admin overrides in `page_seo`), `buildMetadata()` with `productSeo` / `categorySeo` / `guideSeo` from `src/lib/seo-defaults.ts` for dynamic pages. Titles are absolute (include "| Dollnest").
- New fixed pages: add defaults to `src/lib/content/page-seo.ts`, a row to `page_seo` (migration) and the path to `src/app/sitemap.ts`.
- Structured data: Product (+ AggregateRating only from reviews linked to that product), BreadcrumbList via `<Breadcrumbs>`, CollectionPage/ItemList, Article, Organization/WebSite/FAQPage on home. Never mark up shop-wide reviews as product ratings.
- One `<h1>` per page; headings in order; descriptive alt text on product photos.
- Keep `robots.ts` disallowing `/admin`, `/basket`, `/checkout`.
