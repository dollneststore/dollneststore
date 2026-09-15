import type { Tint } from "@/lib/types";

export const container = "mx-auto w-full max-w-[1240px] px-[clamp(16px,4vw,40px)]";

export const buttonPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-pink px-7 py-[15px] text-[15px] font-bold text-cocoa shadow-[0_8px_20px_rgba(212,138,160,.25)] transition-colors hover:bg-dusty hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

export const buttonSoft =
  "inline-flex items-center justify-center gap-2 rounded-[18px] bg-lilac-soft px-4 py-[11px] text-[13px] font-bold text-cocoa transition-colors hover:bg-lilac hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-lilac-soft disabled:hover:text-cocoa";

export const buttonOutline =
  "inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[#ead9e2] bg-white px-5 py-3 text-sm font-bold transition-colors hover:border-lilac hover:text-lilac";

export const eyebrow = "text-[11px] font-bold uppercase tracking-[.18em] text-lilac";

export const sectionTitle = "font-serif text-[clamp(30px,3.5vw,44px)] font-medium leading-[1.05]";

export const card = "rounded-[22px] border border-line bg-white";

export const tintBg: Record<Tint, string> = {
  rose: "bg-rose-soft",
  lilac: "bg-lilac-soft",
  peach: "bg-peach",
  sage: "bg-sage",
  sky: "bg-sky",
};

export function badgeTone(badge: string) {
  const b = badge.toLowerCase();
  if (b.includes("best")) return "bg-blush text-rose";
  if (b.includes("new")) return "bg-sage text-sage-deep";
  if (b.includes("limited")) return "bg-lilac-soft text-lilac";
  return "bg-sky text-sky-deep";
}
