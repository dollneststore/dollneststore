import { WhatsAppIcon } from "@/components/icons";
import { buttonPrimary, card, container, eyebrow } from "@/components/ui/styles";
import { getSiteSettings } from "@/lib/data/catalog";
import { staticPageMetadata } from "@/lib/seo";
import { site, whatsappUrl } from "@/lib/site";

export function generateMetadata() {
  return staticPageMetadata("/contact");
}

export default async function ContactPage() {
  const { socials } = await getSiteSettings();
  const { company } = site;

  return (
    <div className={`${container} pt-[clamp(28px,4vw,56px)] pb-[clamp(56px,7vw,96px)]`}>
      <header className="mb-10 max-w-2xl">
        <span className={eyebrow}>Say hello</span>
        <h1 className="mt-2 font-serif text-[clamp(38px,5vw,60px)] leading-none font-medium">We&apos;d love to hear from you</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Questions about a baby, delivery or an order? Message us — we usually reply within a day.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <section className={`${card} flex flex-col gap-3 p-6`}>
          <h2 className="font-serif text-2xl font-medium">WhatsApp</h2>
          <p className="text-sm text-muted">The quickest way to reach us, see extra photos or reserve a baby.</p>
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={`${buttonPrimary} mt-auto bg-whatsapp text-white hover:bg-[#1eb457]`}>
            <WhatsAppIcon className="size-5" />
            {site.whatsapp.display}
          </a>
        </section>

        <section className={`${card} flex flex-col gap-3 p-6`}>
          <h2 className="font-serif text-2xl font-medium">Email & social</h2>
          <a href={`mailto:${site.email}`} className="font-bold text-lilac hover:underline">
            {site.email}
          </a>
          <ul className="mt-auto flex flex-wrap gap-2 text-sm font-bold">
            {[
              ["TikTok", socials.tiktok],
              ["Instagram", socials.instagram],
              ["Etsy", socials.etsy],
              ["Vinted", socials.vinted],
              ["eBay", socials.ebay],
            ].map(([label, href]) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="block rounded-full border border-line px-3.5 py-2 hover:border-lilac hover:text-lilac">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${card} flex flex-col gap-2 p-6 text-sm md:col-span-2 lg:col-span-1`}>
          <h2 className="font-serif text-2xl font-medium">Company details</h2>
          <p className="font-bold">{company.legalName}</p>
          <address className="leading-relaxed text-muted not-italic">
            {company.address.street}
            <br />
            {company.address.locality}, {company.address.city}
            <br />
            {company.address.postcode}
            <br />
            {company.address.country}
          </address>
          <p className="text-muted">
            Company No. {company.number} · Registered in {company.jurisdiction}
          </p>
          <p className="text-xs text-muted">This is our registered office. We don&apos;t offer collections or viewings.</p>
        </section>
      </div>
    </div>
  );
}
