"use client";

import { useState } from "react";
import { saveCategory } from "@/lib/admin/actions/categories";
import { slugify } from "@/lib/format";
import { categoryDefaults, categoryPath } from "@/lib/seo-defaults";
import { tints, type Category } from "@/lib/types";
import { adminButton, AdminCard, Field, FormMessage, inputClass, MobileSaveBar, SaveStatus } from "./form-ui";
import { SeoFields } from "./seo-fields";
import { useFormAction } from "./use-form-action";

export function CategoryForm({ category }: { category?: Category }) {
  const { state, pending, onSubmit, onInput, dirty } = useFormAction(saveCategory, { warnUnsaved: true });
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(category));
  const errors = state?.fieldErrors ?? {};
  const defaults = categoryDefaults({ slug: slug || "new", name: name || "New collection" });

  return (
    <form onSubmit={onSubmit} onInput={onInput} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_340px]">
      {category ? <input type="hidden" name="originalSlug" value={category.slug} /> : null}

      <div className="flex min-w-0 flex-col gap-6">
        <AdminCard title="Collection">
          <Field label="Name (menus & chips)" htmlFor="name" error={errors.name}>
            <input
              id="name"
              name="name"
              required
              maxLength={60}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              className={inputClass}
            />
          </Field>
          <Field
            label="URL"
            htmlFor="slug"
            error={errors.slug}
            hint={category ? `dollneststore.co.uk${categoryPath(slug)} · URLs can't change once created` : `dollneststore.co.uk${categoryPath(slug || "…")}`}
          >
            <input
              id="slug"
              name="slug"
              required
              readOnly={Boolean(category)}
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value.toLowerCase());
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Short description" htmlFor="description" error={errors.description} hint="Shown under the collection on the home page, e.g. “Floppy & squishy”.">
            <input id="description" name="description" maxLength={120} defaultValue={category?.description ?? ""} className={inputClass} />
          </Field>
          <Field
            label="Page text"
            htmlFor="intro"
            error={errors.intro}
            hint="Shown below the babies on the collection page. Use ## for headings, - for bullet points, [text](/link) for links. Leave empty to use the built-in text."
          >
            <textarea id="intro" name="intro" rows={10} defaultValue={category?.intro ?? ""} placeholder={defaults.intro} className={`${inputClass} font-mono text-[13px]`} />
          </Field>
        </AdminCard>

        <AdminCard title="Search engine (SEO)">
          <SeoFields
            path={categoryPath(slug || "…")}
            defaultTitle={defaults.title}
            defaultDescription={defaults.description}
            title={category?.seoTitle}
            description={category?.seoDescription}
            errors={errors}
          />
        </AdminCard>
      </div>

      <div className="flex flex-col gap-6 xl:sticky xl:top-6">
        <AdminCard title="Appearance">
          <Field label="Image URL" htmlFor="imageUrl" error={errors.imageUrl} hint="Copy a photo link from one of your products.">
            <input id="imageUrl" name="imageUrl" type="url" defaultValue={category?.imageUrl ?? ""} className={inputClass} />
          </Field>
          <Field label="Colour" htmlFor="tint" error={errors.tint}>
            <select id="tint" name="tint" defaultValue={category?.tint ?? "rose"} className={inputClass}>
              {tints.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder}>
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className={inputClass} />
          </Field>
        </AdminCard>
        <div className="hidden flex-col gap-3 xl:flex">
          <FormMessage state={state} />
          <button type="submit" disabled={pending} className={adminButton}>
            {pending ? "Saving…" : category ? "Save changes" : "Create collection"}
          </button>
          <SaveStatus dirty={dirty} pending={pending} />
        </div>
      </div>

      <MobileSaveBar state={state} pending={pending} dirty={dirty} label={category ? "Save" : "Create"} />
    </form>
  );
}
