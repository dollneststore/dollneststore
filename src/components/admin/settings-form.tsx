"use client";

import { saveSettings } from "@/lib/admin/actions/settings";
import type { SiteSettings } from "@/lib/types";
import { adminButton, AdminCard, Field, FormMessage, inputClass } from "./form-ui";
import { useFormAction } from "./use-form-action";

const socialFields = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "etsy", label: "Etsy shop" },
  { key: "vinted", label: "Vinted profile" },
  { key: "ebay", label: "eBay profile" },
] as const;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const { state, pending, onSubmit } = useFormAction(saveSettings);
  const errors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <AdminCard title="Announcement bar">
        <Field label="Message" htmlFor="announcement" error={errors.announcement} hint="Shown at the very top of every page. Max 160 characters. Leave empty to hide the bar.">
          <input id="announcement" name="announcement" maxLength={160} defaultValue={settings.announcement} className={inputClass} />
        </Field>
      </AdminCard>
      <AdminCard title="Social links">
        {socialFields.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={f.key} error={errors[f.key]}>
            <input id={f.key} name={f.key} type="url" defaultValue={settings.socials[f.key]} className={inputClass} />
          </Field>
        ))}
      </AdminCard>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${adminButton} w-fit`}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
