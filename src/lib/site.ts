import type { PopupSettings, Socials } from "@/lib/types";

export const site = {
  name: "Dollnest",
  tagline: "Reborn dolls, made with love",
  description:
    "Handcrafted, weighted reborn baby dolls from a small shop in Bristol. Full silicone and cloth-body babies with free tracked UK delivery.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollneststore.co.uk",
  email: "dollneststore@gmail.com",
  logo: "/brand/logo.jpg",
  // Google Analytics. A public id, and it only loads once the visitor agrees.
  analyticsId: "G-QDZ4PQH090",
  whatsapp: {
    number: "447577199805",
    display: "+44 7577 199805",
  },
  company: {
    legalName: "HOYD. Trading Ltd",
    number: "15656841",
    jurisdiction: "England & Wales",
    address: {
      street: "14 Brick Hill Way",
      locality: "Patchway",
      city: "Bristol",
      postcode: "BS34 5UY",
      country: "United Kingdom",
    },
  },
  delivery: {
    dispatch: "within 48 hours",
    arrives: "2–3 working days",
  },
  stats: {
    vintedRating: "5.0",
    vintedReviews: 662,
    ebayPositive: "100%",
    ebayRatings: 984,
    itemsSold: "2.6K",
    sellingSince: 2024,
  },
} as const;

export const defaultSocials: Socials = {
  tiktok: "https://www.tiktok.com/@dollneststore",
  etsy: "https://dollneststore.etsy.com",
  vinted: "https://www.vinted.co.uk/member/294261048-dollnest",
};

export const defaultAnnouncement = "Free tracked UK delivery on every baby ♡ Dispatched within 48 hours";

/** Used until the pop-up is set up in /admin/settings. It stays hidden while it has no code. */
export const defaultPopup: PopupSettings = {
  enabled: false,
  heading: "10% off your first baby ♡",
  body: "Use your code at checkout for 10% off your first order, and we'll send you new babies before anyone else.",
  code: "",
};

export function whatsappUrl(message = "Hi Dollnest! I'd love to ask about one of your reborn babies ♡") {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export const companyLine = `${site.company.legalName} · Company No. ${site.company.number} · Registered in ${site.company.jurisdiction}`;

export const addressLine = [
  site.company.address.street,
  site.company.address.locality,
  site.company.address.city,
  site.company.address.postcode,
].join(", ");
