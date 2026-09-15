"use client";

import { useState } from "react";
import { SEO_DESCRIPTION_LIMIT, SEO_TITLE_LIMIT, truncate } from "@/lib/seo-defaults";
import { Field, inputClass } from "./form-ui";

type Props = {
  path: string;
  defaultTitle: string;
  defaultDescription: string;
  title?: string | null;
  description?: string | null;
  titleName?: string;
  descriptionName?: string;
  idPrefix?: string;
  errors?: Record<string, string[] | undefined>;
};

/** Meta title/description inputs with live character counts and a Google result preview. */
export function SeoFields({
  path,
  defaultTitle,
  defaultDescription,
  title,
  description,
  titleName = "seoTitle",
  descriptionName = "seoDescription",
  idPrefix = "seo",
  errors = {},
}: Props) {
  const [titleValue, setTitleValue] = useState(title ?? "");
  const [descriptionValue, setDescriptionValue] = useState(description ?? "");
  const shownTitle = titleValue.trim() || defaultTitle;
  const shownDescription = descriptionValue.trim() || defaultDescription;
  const breadcrumb = ["dollneststore.co.uk", ...path.split("/").filter(Boolean)].join(" › ");

  return (
    <div className="flex flex-col gap-4">
      <Field label="Meta title" htmlFor={`${idPrefix}-title`} error={errors[titleName]}>
        <input
          id={`${idPrefix}-title`}
          name={titleName}
          maxLength={70}
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          placeholder={defaultTitle}
          className={inputClass}
        />
        <Counter length={shownTitle.length} limit={SEO_TITLE_LIMIT} automatic={!titleValue.trim()} />
      </Field>
      <Field label="Meta description" htmlFor={`${idPrefix}-description`} error={errors[descriptionName]}>
        <textarea
          id={`${idPrefix}-description`}
          name={descriptionName}
          maxLength={170}
          rows={3}
          value={descriptionValue}
          onChange={(e) => setDescriptionValue(e.target.value)}
          placeholder={defaultDescription}
          className={inputClass}
        />
        <Counter length={shownDescription.length} limit={SEO_DESCRIPTION_LIMIT} automatic={!descriptionValue.trim()} />
      </Field>

      <div className="rounded-2xl border border-line bg-white p-4 font-[Arial,sans-serif]" aria-label="Google search preview">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-muted">Google preview</p>
        <p className="truncate text-xs text-[#4d5156]">{breadcrumb}</p>
        <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{truncate(shownTitle, SEO_TITLE_LIMIT + 3)}</p>
        <p className="mt-1 text-sm leading-normal text-[#4d5156]">{truncate(shownDescription, SEO_DESCRIPTION_LIMIT + 5)}</p>
      </div>
    </div>
  );
}

function Counter({ length, limit, automatic }: { length: number; limit: number; automatic: boolean }) {
  const over = length > limit;
  return (
    <p className={`mt-1 text-xs ${over ? "font-semibold text-rose" : "text-muted"}`}>
      {length}/{limit}
      {automatic ? " · automatic text (leave empty to keep)" : ""}
      {over ? " · may be cut off in Google" : ""}
    </p>
  );
}
