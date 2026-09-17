import Image from "next/image";
import Link from "next/link";
import { container } from "@/components/ui/styles";
import { getCategories, getCopyrightYear, getSiteSettings, resolveSettings } from "@/lib/data/catalog";
import { fallback } from "@/lib/errors";
import { categoryDefaults, categoryPath, shopPath } from "@/lib/seo-defaults";
import { addressLine, companyLine, site, whatsappUrl } from "@/lib/site";
import type { Category } from "@/lib/types";
import { NewsletterForm } from "./newsletter-form";

const heading = "text-xs font-bold uppercase tracking-[.14em] text-lilac";

export async function Footer() {
  // The footer sits in the shop layout, outside the reach of error.tsx, so a database
  // failure degrades it (default socials, no collection links) instead of 500ing the page.
  const [{ socials }, categories, year] = await Promise.all([
    getSiteSettings().catch(fallback(resolveSettings(null), "[footer] settings")),
    getCategories().catch(fallback([] as Category[], "[footer] categories")),
    getCopyrightYear(),
  ]);
  // TikTok gets its own button above; eBay is mentioned in the line below without a link.
  const socialLinks = [
    { href: socials.etsy, label: "Etsy", short: "Et", bg: "bg-peach" },
    { href: socials.vinted, label: "Vinted", short: "V", bg: "bg-sage" },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-line bg-white">
      <div className={`${container} pt-[clamp(40px,5vw,64px)]`}>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
          <div className="flex max-w-[320px] flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <Image src={site.logo} alt="" width={44} height={44} className="size-11 rounded-full border-2 border-rose-soft object-cover" />
              <span className="font-serif text-[30px] font-semibold text-lilac">Dollnest</span>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Reborn baby dolls from a small shop in Bristol, England. Every photo is of the real baby you receive —
              never a stock image. Free tracked UK delivery on every order.
            </p>
            {socials.tiktok ? (
              <a
                href={socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 rounded-full bg-cocoa px-4 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.03]"
              >
                <span aria-hidden>♪</span> Watch our babies on TikTok
              </a>
            ) : null}
            <p className="text-xs text-muted">New videos every week. You&apos;ll also find us on eBay.</p>
            <ul className="flex flex-wrap gap-2">
              {socialLinks.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Dollnest on ${s.label}`}
                    className={`grid size-[38px] place-items-center rounded-full text-xs font-bold transition-transform hover:scale-105 ${s.bg}`}
                  >
                    {s.short}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Shop" className="flex flex-col gap-2.5 text-sm">
            <p className={heading}>Shop</p>
            <Link href={shopPath} className="hover:text-lilac">All reborn dolls</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={categoryPath(c.slug)} className="hover:text-lilac">
                {categoryDefaults(c).heading}
              </Link>
            ))}
          </nav>

          <nav aria-label="Help" className="flex flex-col gap-2.5 text-sm">
            <p className={heading}>Help</p>
            <Link href="/reviews" className="hover:text-lilac">Customer reviews</Link>
            <Link href="/guides" className="hover:text-lilac">Guides & care tips</Link>
            <Link href="/delivery-returns" className="hover:text-lilac">Delivery & returns</Link>
            <Link href="/#faq" className="hover:text-lilac">FAQ</Link>
            <Link href="/contact" className="hover:text-lilac">Contact us</Link>
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-lilac">
              WhatsApp {site.whatsapp.display}
            </a>
          </nav>

          <div className="flex flex-col gap-3 text-sm">
            <p className={heading}>Little letters</p>
            <p className="text-[13px] leading-normal text-muted">New babies and gentle offers, once a month.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-[clamp(32px,4vw,48px)] flex items-center justify-center gap-4 border-y border-dashed border-[#ead9e2] py-[18px] text-center text-[11px] uppercase tracking-[.18em] text-lilac">
          <span className="tracking-[4px] text-dusty" aria-hidden>❦</span>
          Thank you for being part of the Dollnest story ♡
          <span className="tracking-[4px] text-dusty" aria-hidden>❦</span>
        </div>

        <div className="flex flex-col gap-3 pt-[18px] pb-[calc(96px+env(safe-area-inset-bottom))] text-xs text-muted lg:flex-row lg:items-start lg:justify-between lg:pb-6">
          <div className="space-y-1">
            <p>© {year} Dollnest · {companyLine}</p>
            <p>Registered office: {addressLine}</p>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-lilac">Privacy</Link>
            <Link href="/terms" className="hover:text-lilac">Terms</Link>
            <Link href="/cookies" className="hover:text-lilac">Cookies</Link>
            <Link href="/delivery-returns" className="hover:text-lilac">Returns</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
