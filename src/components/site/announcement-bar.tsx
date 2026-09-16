import { getSiteSettings, resolveSettings } from "@/lib/data/catalog";
import { fallback } from "@/lib/errors";

export async function AnnouncementBar() {
  // Rendered straight in the shop layout, where error.tsx cannot reach it:
  // if settings can't be read we show the default line rather than a 500.
  const { announcement } = await getSiteSettings().catch(fallback(resolveSettings(null), "[announcement-bar]"));
  if (!announcement) return null;
  return (
    <div className="bg-[linear-gradient(90deg,var(--color-rose-soft),var(--color-lilac-soft))] px-4 py-[9px] text-center text-xs font-semibold uppercase tracking-[.06em]">
      {announcement}
    </div>
  );
}
