import Image from "next/image";
import Link from "next/link";
import { Stars } from "@/components/home/home-sections";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { buttonPrimary, card, container, eyebrow } from "@/components/ui/styles";
import { getReviews } from "@/lib/data/catalog";
import { formatDate } from "@/lib/format";
import { staticPageMetadata } from "@/lib/seo";
import { reviewsPath, shopPath } from "@/lib/seo-defaults";
import { site } from "@/lib/site";

export function generateMetadata() {
  return staticPageMetadata("/reviews");
}

const sourceLabel: Record<string, string> = {
  etsy: "Etsy",
  vinted: "Vinted",
  ebay: "eBay",
  tiktok: "TikTok",
  website: "Dollnest",
};

export default async function ReviewsPage() {
  const reviews = await getReviews(500);
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const withPhotos = reviews.filter((r) => r.imageUrl).length;

  return (
    <div className={`${container} pt-[clamp(20px,3vw,40px)] pb-[clamp(56px,7vw,96px)]`}>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Reviews", path: reviewsPath },
        ]}
      />

      <header className="mb-8 flex max-w-2xl flex-col gap-2">
        <span className={eyebrow}>Loved by families</span>
        <h1 className="font-serif text-[clamp(38px,5vw,60px)] leading-none font-medium">What families say</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Every review here was left by a real customer who bought from us
          {withPhotos > 0 ? `, and ${withPhotos} of them shared their own photo at home` : ""}. Each one shows where it
          was left. We never write reviews ourselves.
        </p>
      </header>

      {reviews.length ? (
        <>
          <div className="mb-8 flex flex-wrap gap-4">
            <div className={`${card} flex items-center gap-3.5 px-5 py-4`}>
              <span className="text-[30px] font-bold tracking-tight text-lilac">{average.toFixed(1)}</span>
              <div>
                <Stars rating={average} />
                <p className="text-xs text-muted">{reviews.length} reviews on this page</p>
              </div>
            </div>
            <div className={`${card} flex items-center gap-3.5 px-5 py-4`}>
              <span className="text-[30px] font-bold tracking-tight text-lilac">{site.stats.vintedRating}</span>
              <div>
                <p className="text-[13px] font-bold">on Vinted</p>
                <p className="text-xs text-muted">{site.stats.vintedReviews} happy families</p>
              </div>
            </div>
            <div className={`${card} flex items-center gap-3.5 px-5 py-4`}>
              <span className="text-[30px] font-bold tracking-tight text-lilac">{site.stats.ebayPositive}</span>
              <div>
                <p className="text-[13px] font-bold">positive on eBay</p>
                <p className="text-xs text-muted">{site.stats.ebayRatings} ratings since {site.stats.sellingSince}</p>
              </div>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id} className={`${card} flex flex-col gap-3 p-[22px]`}>
                <Stars rating={r.rating} />
                {r.imageUrl ? (
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-blush">
                    <Image
                      src={r.imageUrl}
                      alt={`Photo of their Dollnest baby shared by ${r.authorName}`}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <blockquote className="font-serif text-[19px] leading-snug text-pretty">“{r.body}”</blockquote>
                <figcaption className="mt-auto text-xs text-muted">
                  <b className="text-cocoa">{r.authorName}</b> · {sourceLabel[r.source] ?? r.source}
                  {r.reviewedAt ? ` · ${formatDate(r.reviewedAt)}` : ""}
                </figcaption>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-muted">Our first reviews are on their way ♡</p>
      )}

      <section className="mt-[clamp(48px,6vw,80px)] flex flex-col items-start gap-3 rounded-[28px] bg-[linear-gradient(135deg,var(--color-blush),var(--color-lilac-soft))] p-[clamp(20px,3vw,40px)]">
        <h2 className="font-serif text-3xl font-medium">Ready to meet your little one?</h2>
        <p className="text-muted">Free tracked UK delivery on every baby, with 14-day returns.</p>
        <Link href={shopPath} className={buttonPrimary}>
          Shop reborn dolls ♡
        </Link>
      </section>
    </div>
  );
}
