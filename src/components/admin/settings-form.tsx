"use client";

import { saveSettings } from "@/lib/admin/actions/settings";
import type { SiteSettings } from "@/lib/types";
import { adminButton, AdminCard, Field, FormMessage, inputClass, MobileSaveBar, SaveStatus } from "./form-ui";
import { useFormAction } from "./use-form-action";

const socialFields = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "etsy", label: "Etsy shop" },
  { key: "vinted", label: "Vinted profile" },
  { key: "ebay", label: "eBay profile" },
] as const;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const { state, pending, onSubmit, onInput, dirty } = useFormAction(saveSettings, { warnUnsaved: true });
  const errors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} onInput={onInput} className="flex max-w-2xl flex-col gap-6">
      <AdminCard title="Announcement bar">
        <Field
          label="Message"
          htmlFor="announcement"
          error={errors.announcement}
          hint="Shown at the very top of every page. Max 160 characters. Leave empty to hide the bar."
        >
          <input id="announcement" name="announcement" maxLength={160} defaultValue={settings.announcement} className={inputClass} />
        </Field>
      </AdminCard>
      <AdminCard title="Social links">
        <p className="text-xs text-muted">Leave a link empty to hide it across the shop.</p>
        {socialFields.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={f.key} error={errors[f.key]}>
            <input id={f.key} name={f.key} type="url" defaultValue={settings.socials[f.key]} className={inputClass} />
          </Field>
        ))}
      </AdminCard>
      <div className="hidden flex-col items-start gap-3 xl:flex">
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={adminButton}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        <SaveStatus dirty={dirty} pending={pending} />
      </div>
      <MobileSaveBar state={state} pending={pending} dirty={dirty} label="Save settings" />
    </form>
  );
}
