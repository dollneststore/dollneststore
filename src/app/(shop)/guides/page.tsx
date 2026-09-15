import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { container, eyebrow } from "@/components/ui/styles";
import { getGuides } from "@/lib/data/catalog";
import { formatDate } from "@/lib/format";
import { staticPageMetadata } from "@/lib/seo";
import { guidePath, shopPath } from "@/lib/seo-defaults";

export function generateMetadata() {
  return staticPageMetadata("/guides");
}

export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <div className={`${container} pt-[clamp(20px,3vw,40px)] pb-[clamp(56px,7vw,96px)]`}>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ]}
      />
      <header className="mb-10 flex max-w-2xl flex-col gap-2">
        <span className={eyebrow}>Dollnest guides</span>
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-none font-medium">Guides & care tips</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Everything we&apos;ve learned about choosing, caring for and cuddling reborn babies — straight from our nursery in Bristol.
        </p>
      </header>

      {guides.length ? (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <li key={guide.id}>
              <Link
                href={guidePath(guide.slug)}
                className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-white transition-shadow hover:shadow-[0_14px_34px_rgba(143,107,177,.14)]"
              >
                <div className="relative aspect-[16/10] bg-[linear-gradient(135deg,var(--color-blush),var(--color-lilac-soft))]">
                  {guide.coverImageUrl ? (
                    <Image
                      src={guide.coverImageUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center font-serif text-5xl text-lilac" aria-hidden>
                      ❦
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="font-serif text-2xl leading-tight font-semibold group-hover:text-lilac">{guide.title}</h2>
                  {guide.excerpt ? <p className="text-sm leading-relaxed text-muted">{guide.excerpt}</p> : null}
                  <p className="mt-auto pt-2 text-xs font-semibold text-lilac">
                    {guide.publishedAt ? `${formatDate(guide.publishedAt)} · ` : ""}Read guide →
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[22px] border border-dashed border-lilac-line bg-white/70 px-6 py-16 text-center">
          <p className="font-serif text-3xl">Our first guides are on the way ♡</p>
          <Link href={shopPath} className="mt-5 inline-block font-bold text-lilac hover:underline">
            Meet our reborn dolls →
          </Link>
        </div>
      )}
    </div>
  );
}
