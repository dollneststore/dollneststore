import { getSiteSettings } from "@/lib/data/catalog";

export async function AnnouncementBar() {
  const { announcement } = await getSiteSettings();
  return (
    <div className="bg-[linear-gradient(90deg,var(--color-rose-soft),var(--color-lilac-soft))] px-4 py-[9px] text-center text-xs font-semibold uppercase tracking-[.06em]">
      {announcement}
    </div>
  );
}
