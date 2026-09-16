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
  const [settings, etsyPhotos] = await Promise.all([getAdminSettings(), getEtsyPhotoCount()]);
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <SettingsForm settings={settings} />
      <AdminCard title="Photo storage">
        <PhotoMigration initialRemaining={etsyPhotos} />
      </AdminCard>
    </div>
  );
}
