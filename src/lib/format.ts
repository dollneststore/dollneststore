const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbpWhole = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London",
});
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

export function formatPrice(pence: number) {
  return pence % 100 === 0 ? gbpWhole.format(pence / 100) : gbp.format(pence / 100);
}

/** "199.99" → 19999 (pence). Up to £99,999.99. Returns null for anything that is not a valid amount. */
export function poundsToPence(input: string): number | null {
  const cleaned = input.replace(/[£,\s]/g, "");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export function penceToPounds(pence: number | null | undefined) {
  return pence == null ? "" : (pence / 100).toFixed(2);
}

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

const categoryLabels: Record<string, string> = {
  silicone: "full silicone",
  "cloth-body": "cloth body",
  weighted: "weighted cloth body",
  mini: "mini reborn",
};

export function productMeta(p: { lengthIn: number | null; weightLbs: number | null; categorySlug: string | null }) {
  return [
    p.lengthIn ? `${p.lengthIn} in` : null,
    p.weightLbs ? `${p.weightLbs} lbs` : null,
    p.categorySlug ? (categoryLabels[p.categorySlug] ?? p.categorySlug) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Splits a free-text listing description into a lead paragraph and bullet points. */
export function parseDescription(text: string) {
  const parts = text
    .split(/\n+|•/)
    .map((part) => part.trim())
    .filter(Boolean);
  return { lead: parts[0] ?? "", bullets: parts.slice(1) };
}
