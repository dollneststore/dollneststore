import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { buttonPrimary, card, eyebrow, sectionTitle, tintBg } from "@/components/ui/styles";
import { faqs } from "@/lib/content/faq";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import type { Category, Product, Review, Socials } from "@/lib/types";

function Fleuron({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`tracking-[6px] text-lilac ${className}`}>
      ❦
    </span>
  );
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span role="img" aria-label={`${full} out of 5 stars`} className="text-[13px] tracking-[2px] text-star">
      {"★".repeat(full)}
      <span className="text-line">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function Hero({ imageUrl }: { imageUrl: string }) {
  return (
    <section className="grid items-center gap-[clamp(24px,4vw,56px)] pt-[clamp(32px,5vw,72px)] pb-[clamp(40px,5vw,64px)] md:grid-cols-2">
      <div className="flex flex-col items-start gap-5">
        <span className={`flex items-center gap-2 ${eyebrow}`}>
          <span className="text-dusty">♡</span>Welcome to Dollnest<span className="text-dusty">♡</span>
        </span>
        <h1 className="font-serif text-[clamp(42px,6vw,78px)] leading-none font-medium text-pretty">
          Tiny dreams,
          <br />
          <em className="text-lilac italic">forever in your arms.</em>
        </h1>
        <p className="max-w-[440px] text-[clamp(15px,1.3vw,18px)] leading-relaxed text-pretty text-muted">
          Soft, weighted reborn babies that feel just like a newborn — dressed, wrapped with care and posted free across the UK.
        </p>
        <div className="mt-1 flex flex-wrap gap-3">
          <Link href="/reborn-dolls" className={buttonPrimary}>
            Shop babies ♡
          </Link>
          <Link href="/#collections" className="px-5 py-[15px] text-[15px] font-bold text-lilac hover:underline">
            Explore collections →
          </Link>
        </div>
        <ul className="mt-2 flex flex-wrap gap-[18px] text-xs font-semibold text-muted">
          <li className="flex items-center gap-1.5">
            <span className="grid size-[22px] place-items-center rounded-full bg-blush text-[11px] text-rose">♡</span>Weighted & floppy
          </li>
          <li className="flex items-center gap-1.5">
            <span className="grid size-[22px] place-items-center rounded-full bg-sage text-[11px] text-sage-deep">✿</span>Safe, soft materials
          </li>
          <li className="flex items-center gap-1.5">
            <span className="grid size-[22px] place-items-center rounded-full bg-lilac-soft text-[11px] text-lilac">❦</span>Small shop, Bristol
          </li>
        </ul>
      </div>

      <div className="relative mx-auto aspect-[1/1.1] w-full max-w-[510px]">
        <div className="absolute inset-0 rounded-[50%_50%_36px_36px] border-[1.5px] border-dashed border-lilac-line" />
        <div className="absolute inset-3.5 rounded-[50%_50%_28px_28px] bg-[linear-gradient(160deg,var(--color-lilac-soft),var(--color-rose-soft))]" />
        <div className="absolute inset-[30px] overflow-hidden rounded-[50%_50%_16px_16px]">
          <Image
            src={imageUrl}
            alt="A sleeping reborn baby girl dressed in pink"
            fill
            preload
            sizes="(min-width: 768px) 45vw, 90vw"
            className="object-cover"
          />
        </div>
        <div className="absolute bottom-9 -left-2 flex items-center gap-2.5 rounded-[18px] bg-white px-4 py-3 shadow-[0_12px_34px_rgba(91,63,46,.12)]">
          <span className="grid size-9 place-items-center rounded-full bg-lilac-soft text-base text-lilac">★</span>
          <div>
            <p className="text-[13px] font-bold">{site.stats.vintedRating} on Vinted</p>
            <p className="text-[11px] text-muted">{site.stats.vintedReviews} happy families</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedBabies({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="featured-heading" className="pb-[clamp(40px,5vw,72px)]">
      <div className="mb-[22px] flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <span className={`border-b-2 border-lilac-soft pb-1 ${eyebrow}`}>Featured babies</span>
          <h2 id="featured-heading" className="mt-2.5 font-serif text-[clamp(30px,3.5vw,42px)] font-medium">
            Ready for a new home
          </h2>
        </div>
        <Link href="/reborn-dolls" className="text-sm font-bold text-lilac hover:underline">
          View all babies →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-[18px] min-[560px]:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

const trust = [
  { glyph: "♡", title: "Realistic touch", sub: "Soft, weighted bodies that feel like a newborn", tone: "bg-blush text-rose" },
  { glyph: "✉", title: "Free UK delivery", sub: `Tracked and carefully packed, ${site.delivery.arrives}`, tone: "bg-sage text-sage-deep" },
  { glyph: "↺", title: "14-day returns", sub: "Shop with confidence under UK consumer law", tone: "bg-peach text-peach-deep" },
  { glyph: "❦", title: "Small shop, Bristol", sub: `Rehoming babies since ${site.stats.sellingSince}`, tone: "bg-lilac-soft text-lilac" },
];

export function TrustStrip() {
  return (
    <section
      aria-label="Why families choose Dollnest"
      className={`mb-[clamp(48px,6vw,88px)] grid grid-cols-1 gap-[18px] p-[clamp(18px,2.5vw,28px)] sm:grid-cols-2 lg:grid-cols-4 ${card} rounded-3xl`}
    >
      {trust.map((t) => (
        <div key={t.title} className="flex items-start gap-3.5">
          <span className={`grid size-[46px] flex-none place-items-center rounded-full text-lg ${t.tone}`} aria-hidden>
            {t.glyph}
          </span>
          <div>
            <p className="text-sm font-bold">{t.title}</p>
            <p className="mt-0.5 text-xs leading-normal text-muted">{t.sub}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function Collections({ categories, fromPrices }: { categories: Category[]; fromPrices: Record<string, number> }) {
  return (
    <section id="collections" aria-labelledby="collections-heading" className="scroll-mt-24 pb-[clamp(48px,6vw,88px)]">
      <div className="mb-7 text-center">
        <Fleuron className="text-sm" />
        <h2 id="collections-heading" className={`mt-1.5 ${sectionTitle}`}>
          Find your little one
        </h2>
        <p className="mt-2 text-[15px] text-muted">Four gentle ways to choose.</p>
      </div>
      <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-4">
        {categories.map((c) => (
          <Link key={c.slug} href={`/reborn-dolls/${c.slug}`} className="group flex flex-col items-center gap-3 text-center">
            <div className={`w-full rounded-[50%_50%_18px_18px] p-2.5 ${tintBg[c.tint]}`}>
              <div className="relative aspect-[1/1.1] overflow-hidden rounded-[50%_50%_10px_10px]">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : null}
              </div>
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold group-hover:text-lilac">{c.name}</p>
              <p className="mt-0.5 text-[13px] text-muted">
                {c.description}
                {fromPrices[c.slug] ? ` · from ${formatPrice(fromPrices[c.slug])}` : " · coming soon"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const values = [
  { glyph: "♡", title: "Chosen with love", text: "Every baby is checked, dressed and wrapped by hand before it leaves the nest.", bg: "bg-blush", fg: "text-rose" },
  { glyph: "✿", title: "Safe materials", text: "Soft silicone and cloth bodies with baby-safe finishes, gentle for little hands.", bg: "bg-sage", fg: "text-sage-deep" },
  { glyph: "❦", title: "Keepsakes forever", text: "Made to be cuddled and kept — a companion that lasts a lifetime.", bg: "bg-lilac-soft", fg: "text-lilac" },
];

export function Values() {
  return (
    <section aria-labelledby="values-heading" className="pb-[clamp(48px,6vw,88px)]">
      <div className="mb-6 text-center">
        <h2 id="values-heading" className={`flex items-center justify-center gap-3.5 ${sectionTitle}`}>
          <span className="text-lg text-dusty" aria-hidden>❦</span>What matters most<span className="text-lg text-dusty" aria-hidden>❦</span>
        </h2>
        <p className="mx-auto mt-2 max-w-[520px] text-[15px] text-pretty text-muted">
          At Dollnest every baby is more than a doll — chosen, dressed and sent with love, intention and care.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className={`flex items-start gap-4 rounded-[22px] p-[26px] ${v.bg}`}>
            <span className={`grid size-11 flex-none place-items-center rounded-full bg-white/70 text-lg ${v.fg}`} aria-hidden>
              {v.glyph}
            </span>
            <div>
              <h3 className="font-serif text-[22px] font-semibold">{v.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#6b5a60]">{v.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="mb-[clamp(48px,6vw,88px)] grid scroll-mt-24 grid-cols-1 items-center gap-[clamp(20px,3vw,40px)] rounded-[32px] bg-[linear-gradient(135deg,var(--color-blush),var(--color-lilac-soft))] p-[clamp(24px,4vw,48px)] lg:grid-cols-[minmax(260px,1fr)_2fr]"
    >
      <div className="flex flex-col gap-[18px]">
        <div>
          <Fleuron className="text-sm" />
          <h2 id="reviews-heading" className={`mt-1.5 ${sectionTitle}`}>
            Loved by families
          </h2>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl bg-white/85 px-4 py-3">
          <span className="text-[30px] font-bold tracking-tight text-lilac">{site.stats.vintedRating}</span>
          <div>
            <Stars rating={5} />
            <p className="text-xs text-muted">{site.stats.vintedReviews} reviews on Vinted</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl bg-white/85 px-4 py-3">
          <span className="text-[30px] font-bold tracking-tight text-lilac">{site.stats.ebayPositive}</span>
          <div>
            <p className="text-[13px] font-bold">positive feedback</p>
            <p className="text-xs text-muted">
              {site.stats.ebayRatings} ratings on eBay · {site.stats.itemsSold} items sold since {site.stats.sellingSince}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r.id} className="flex flex-col gap-3 rounded-[20px] bg-white p-[22px]">
            <Stars rating={r.rating} />
            {r.imageUrl ? (
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-blush">
                <Image src={r.imageUrl} alt={`Photo shared by ${r.authorName}`} fill sizes="240px" className="object-cover" />
              </div>
            ) : null}
            <blockquote className="font-serif text-[19px] leading-snug text-pretty">“{r.body}”</blockquote>
            <figcaption className="mt-auto text-xs text-muted">
              <b className="text-cocoa">{r.authorName}</b> · Verified buyer
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const socialTints = ["bg-blush", "bg-lilac-soft", "bg-peach", "bg-sky", "bg-sage"];

export function SocialSection({ images, socials }: { images: string[]; socials: Socials }) {
  return (
    <section aria-labelledby="social-heading" className="pb-[clamp(48px,6vw,88px)]">
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
        <h2 id="social-heading" className={sectionTitle}>
          Follow along <em className="text-lilac">@dollneststore</em>
        </h2>
        <div className="flex flex-wrap gap-2 text-[13px] font-bold">
          {[
            { href: socials.tiktok, label: "TikTok" },
            { href: socials.instagram, label: "Instagram" },
            { href: socials.etsy, label: "Etsy" },
          ]
            .filter((link) => link.href)
            .map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-[20px] px-4 py-2.5 ${index === 0 ? "bg-cocoa text-white" : "border-[1.5px] border-[#ead9e2] bg-white"}`}
              >
                {link.label}
              </a>
            ))}
        </div>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        {images.map((src, i) => (
          <li key={src}>
            <a
              href={socials.tiktok || socials.instagram || "/reborn-dolls"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Watch Dollnest on TikTok"
              className={`relative block aspect-[9/13] overflow-hidden rounded-[50%_50%_16px_16px] ${socialTints[i % socialTints.length]}`}
            >
              <Image src={src} alt="" fill sizes="200px" className="object-cover transition-transform duration-500 hover:scale-[1.04]" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="grid scroll-mt-24 grid-cols-1 gap-[clamp(20px,4vw,56px)] pb-[clamp(56px,7vw,96px)] lg:grid-cols-[340px_1fr]"
    >
      <div>
        <h2 id="faq-heading" className={sectionTitle}>
          Good to know
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Can&apos;t find your answer? Message us on WhatsApp, TikTok or Instagram — we reply within a day.
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        {faqs.map((item) => (
          <details key={item.q} className="group rounded-[18px] border border-line bg-white px-[22px] py-[18px]">
            <summary className="flex cursor-pointer list-none justify-between gap-3 text-[15px] font-bold">
              {item.q}
              <span className="text-lilac transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
