import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCard, LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { PhotoMigration } from "@/components/admin/photo-migration";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSettings, getEtsyPhotoCount } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Announcement bar, social links and shop maintenance." />
      <Suspense fallback={<LoadingBlock />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  // The photo counter is extra information: it must never stop the settings form from loading.
  const [settings, etsyPhotos] = await Promise.all([
    getAdminSettings(),
    getEtsyPhotoCount().catch((error: unknown) => {
      console.error("[admin/settings] photo count", error);
      return null;
    }),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <SettingsForm settings={settings} />
      <AdminCard title="Photo storage">
        {etsyPhotos === null ? (
          <p className="text-sm text-muted">Couldn&apos;t check where the photos are stored right now. Reload to try again.</p>
        ) : (
          <PhotoMigration initialRemaining={etsyPhotos} />
        )}
      </AdminCard>
    </div>
  );
}
