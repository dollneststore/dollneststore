"use client";

import { useEffect, useRef } from "react";
import { createReview } from "@/lib/admin/actions/reviews";
import { reviewSources } from "@/lib/types";
import { adminButton, AdminCard, Field, FormMessage, inputClass } from "./form-ui";
import { useFormAction } from "./use-form-action";

export function ReviewForm() {
  const { state, pending, onSubmit } = useFormAction(createReview);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <AdminCard title="Add a review">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Customer name" htmlFor="authorName" error={errors.authorName}>
            <input id="authorName" name="authorName" required maxLength={80} className={inputClass} />
          </Field>
          <Field label="Rating" htmlFor="rating" error={errors.rating}>
            <select id="rating" name="rating" defaultValue="5" className={inputClass}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {"★".repeat(r)} ({r})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source" htmlFor="source" error={errors.source}>
            <select id="source" name="source" defaultValue="vinted" className={inputClass}>
              {reviewSources.map((s) => (
                <option key={s} value={s}>
                  {s === "ebay" ? "eBay" : s === "tiktok" ? "TikTok" : s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Review" htmlFor="body" error={errors.body}>
          <textarea id="body" name="body" required rows={3} maxLength={2000} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="reviewedAt" error={errors.reviewedAt}>
            <input id="reviewedAt" name="reviewedAt" type="date" className={inputClass} />
          </Field>
          <Field label="Photo URL (optional)" htmlFor="imageUrl" error={errors.imageUrl}>
            <input id="imageUrl" name="imageUrl" type="url" placeholder="https://" className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" name="isPublished" defaultChecked className="size-4 accent-lilac" />
          Show on the website
        </label>
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={`${adminButton} w-fit`}>
          {pending ? "Saving…" : "Add review"}
        </button>
      </AdminCard>
    </form>
  );
}
