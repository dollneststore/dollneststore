"use client";

import { useEffect, useRef } from "react";
import { saveDiscountCode } from "@/lib/admin/actions/discounts";
import { adminButton, AdminCard, Field, FormMessage, inputClass } from "./form-ui";
import { useFormAction } from "./use-form-action";

export function DiscountForm() {
  const { state, pending, onSubmit } = useFormAction(saveDiscountCode);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <AdminCard title="Add a discount code">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="code" error={errors.code} hint="Customers type this, e.g. WELCOME10.">
            <input id="code" name="code" required maxLength={24} placeholder="WELCOME10" className={`${inputClass} uppercase`} />
          </Field>
          <Field label="Discount %" htmlFor="percentOff" error={errors.percentOff}>
            <input id="percentOff" name="percentOff" type="number" min={1} max={90} defaultValue={10} className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Starts" htmlFor="startsAt" error={errors.startsAt} hint="Leave empty to start straight away.">
            <input id="startsAt" name="startsAt" type="date" className={inputClass} />
          </Field>
          <Field label="Ends" htmlFor="expiresAt" error={errors.expiresAt} hint="Works all day on the date you choose.">
            <input id="expiresAt" name="expiresAt" type="date" className={inputClass} />
          </Field>
        </div>
        <Field label="Note (only you see this)" htmlFor="note" error={errors.note}>
          <input id="note" name="note" maxLength={200} placeholder="Welcome pop-up discount" className={inputClass} />
        </Field>
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="isActive" defaultChecked className="size-4 accent-lilac" />
          Switched on
        </label>
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="overwrite" className="size-4 accent-lilac" />
          Replace the existing code, if this code already exists
        </label>
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={`${adminButton} w-fit`}>
          {pending ? "Saving…" : "Save code"}
        </button>
      </AdminCard>
    </form>
  );
}
