import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSettings } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Announcement bar and social links shown across the shop." />
      <Suspense fallback={<LoadingBlock />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const settings = await getAdminSettings();
  return <SettingsForm settings={settings} />;
}
