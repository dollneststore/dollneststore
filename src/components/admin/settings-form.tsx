"use client";

import { saveSettings } from "@/lib/admin/actions/settings";
import type { SiteSettings } from "@/lib/types";
import { adminButton, AdminCard, Field, FormMessage, inputClass, MobileSaveBar, SaveStatus } from "./form-ui";
import { useFormAction } from "./use-form-action";

// eBay is mentioned in the shop copy but never linked (we sell other things there),
// so it has no field here.
const socialFields = [
  { key: "tiktok", label: "TikTok (shown first everywhere)" },
  { key: "etsy", label: "Etsy shop" },
  { key: "vinted", label: "Vinted profile" },
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

      <AdminCard title="Welcome pop-up">
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="popupEnabled" defaultChecked={settings.popup.enabled} className="size-4 accent-lilac" />
          Show the pop-up to new visitors
        </label>
        <p className="text-xs text-muted">
          Appears once, seven seconds after someone arrives, and not again for 30 days. It never interrupts the basket or
          checkout.
        </p>
        <Field label="Heading" htmlFor="popupHeading" error={errors.popupHeading}>
          <input id="popupHeading" name="popupHeading" maxLength={80} defaultValue={settings.popup.heading} className={inputClass} />
        </Field>
        <Field label="Text" htmlFor="popupBody" error={errors.popupBody}>
          <textarea id="popupBody" name="popupBody" rows={3} maxLength={240} defaultValue={settings.popup.body} className={inputClass} />
        </Field>
        <Field
          label="Discount code"
          htmlFor="popupCode"
          error={errors.popupCode}
          hint="Must be a code that exists and is switched on under Discounts. Leave empty to hide the pop-up."
        >
          <input
            id="popupCode"
            name="popupCode"
            maxLength={24}
            defaultValue={settings.popup.code}
            placeholder="WELCOME10"
            className={`${inputClass} uppercase`}
          />
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
