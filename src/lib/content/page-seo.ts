/** Default titles and descriptions for static pages. Values saved in /admin/seo override these. */
export const pageSeoDefaults = {
  "/": {
    label: "Home page",
    title: "Reborn Dolls UK – Lifelike Silicone Reborn Babies | Dollnest",
    description:
      "Handcrafted silicone and weighted reborn baby dolls from a small shop in Bristol. 5★ rated by 662 families, free tracked UK delivery and 14-day returns.",
  },
  "/reborn-dolls": {
    label: "All reborn dolls",
    title: "Reborn Dolls for Sale UK – Silicone & Weighted | Dollnest",
    description:
      "Shop realistic reborn dolls for sale in the UK: full silicone, weighted and cloth-body babies, each dressed with love. Free tracked delivery in 2–3 days.",
  },
  "/reviews": {
    label: "Reviews",
    title: "Dollnest Reviews – What Families Say About Our Reborn Dolls",
    description:
      "Real reviews from families who have welcomed a Dollnest reborn baby home, with their own photos, from Etsy, Vinted and eBay.",
  },
  "/guides": {
    label: "Guides",
    title: "Reborn Doll Guides, Care Tips & Advice | Dollnest",
    description:
      "Friendly guides for reborn doll collectors and families: caring for silicone babies, choosing your first reborn and more from the Dollnest nursery.",
  },
  "/contact": {
    label: "Contact",
    title: "Contact Dollnest – Reborn Doll Shop in Bristol, UK",
    description:
      "Message Dollnest on WhatsApp, email or social media about any reborn baby, delivery or order. We usually reply within a day.",
  },
  "/delivery-returns": {
    label: "Delivery & returns",
    title: "Delivery & Returns – Free Tracked UK Delivery | Dollnest",
    description:
      "Free tracked UK delivery on every reborn doll, dispatched within 48 hours, plus 14-day returns under UK consumer law.",
  },
  "/privacy": {
    label: "Privacy policy",
    title: "Privacy Policy | Dollnest",
    description: "How Dollnest (HOYD. Trading Ltd) collects, uses and protects your personal data under UK GDPR.",
  },
  "/terms": {
    label: "Terms & conditions",
    title: "Terms & Conditions | Dollnest",
    description: "Terms and conditions for buying reborn dolls from Dollnest, operated by HOYD. Trading Ltd.",
  },
  "/cookies": {
    label: "Cookie policy",
    title: "Cookie Policy | Dollnest",
    description: "Dollnest uses no advertising or analytics cookies. Find out what we store on your device and why.",
  },
} as const satisfies Record<string, { label: string; title: string; description: string }>;

export type StaticSeoPath = keyof typeof pageSeoDefaults;
