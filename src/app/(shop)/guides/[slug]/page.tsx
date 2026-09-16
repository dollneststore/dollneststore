import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/guides/markdown";
import { WhatsAppIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { buttonOutline, buttonPrimary, container } from "@/components/ui/styles";
import { getGuideBySlug, getGuides } from "@/lib/data/catalog";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import { guidePath, guideSeo, shopPath } from "@/lib/seo-defaults";
import { site, whatsappUrl } from "@/lib/site";

export async function generateStaticParams() {
  const guides = await getGuides();
  // Cache Components requires at least one param. While no guide is published, this placeholder
  // keeps the route buildable; generateMetadata below answers it with a real 404.
  return guides.length ? guides.map((g) => ({ slug: g.slug })) : [{ slug: "coming-soon" }];
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  // Streamed routes answer with a 200 and this noindex tag; see the note in reborn-dolls/[slug].
  if (!guide) return { title: "Guide not found", robots: { index: false } };
  const seo = guideSeo(guide);
  return buildMetadata({
    title: seo.title,
    description: seo.description,
    path: guidePath(guide.slug),
    image: guide.coverImageUrl,
    article: { publishedTime: guide.publishedAt, modifiedTime: guide.updatedAt },
  });
}

export default function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  return (
    <Suspense fallback={<div className={`${container} h-96 max-w-3xl animate-pulse py-10`} aria-hidden />}>
      <GuideArticle params={params} />
    </Suspense>
  );
}

async function GuideArticle({ params }: Pick<PageProps<"/guides/[slug]">, "params">) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);
  if (!guide) notFound();

  const seo = guideSeo(guide);
  const url = `${site.url}${guidePath(guide.slug)}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: seo.description,
    image: guide.coverImageUrl ? [guide.coverImageUrl] : undefined,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt ?? guide.publishedAt,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: `${site.url}${site.logo}` },
    },
    mainEntityOfPage: url,
  };

  return (
    <article className={`${container} max-w-3xl pt-[clamp(20px,3vw,40px)] pb-[clamp(56px,7vw,96px)]`}>
      <JsonLd data={articleLd} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: guidePath(guide.slug) },
        ]}
      />
      <header className="mb-8">
        <h1 className="font-serif text-[clamp(36px,5vw,56px)] leading-[1.05] font-medium text-pretty">{guide.title}</h1>
        {guide.publishedAt ? (
          <p className="mt-3 text-sm text-muted">
            <time dateTime={guide.publishedAt}>{formatDate(guide.publishedAt)}</time> · Dollnest nursery, Bristol
          </p>
        ) : null}
        {guide.excerpt ? <p className="mt-5 text-lg leading-relaxed text-[#6b5a60]">{guide.excerpt}</p> : null}
      </header>

      {guide.coverImageUrl ? (
        <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-[28px] bg-blush">
          <Image src={guide.coverImageUrl} alt="" fill preload sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
      ) : null}

      <Markdown source={guide.body} className="text-[17px]" />

      <aside className="mt-14 flex flex-col gap-4 rounded-[28px] bg-[linear-gradient(135deg,var(--color-blush),var(--color-lilac-soft))] p-[clamp(20px,3vw,36px)]">
        <p className="font-serif text-3xl">Ready to meet your little one?</p>
        <p className="text-muted">Every baby comes home dressed with love, with free tracked UK delivery.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={shopPath} className={buttonPrimary}>
            Shop reborn dolls ♡
          </Link>
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={buttonOutline}>
            <WhatsAppIcon className="size-5 text-whatsapp" />
            Ask us anything
          </a>
        </div>
      </aside>
    </article>
  );
}
