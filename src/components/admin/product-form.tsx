"use client";

import { useState } from "react";
import { saveProduct } from "@/lib/admin/actions/products";
import { penceToPounds, slugify } from "@/lib/format";
import { defaultProductDescription, defaultProductTitle, productPath } from "@/lib/seo-defaults";
import { genders, productStatuses, type Category, type Product } from "@/lib/types";
import { adminButton, AdminCard, Field, FormMessage, inputClass, MobileSaveBar, SaveStatus } from "./form-ui";
import { ImageUploader } from "./image-uploader";
import { SeoFields } from "./seo-fields";
import { useFormAction } from "./use-form-action";

const statusLabels: Record<(typeof productStatuses)[number], string> = {
  draft: "Draft — hidden from shop",
  active: "Active — for sale",
  sold_out: "Sold out — shown as rehomed",
  archived: "Archived — hidden",
};

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const { state, pending, onSubmit, onInput, markDirty, dirty } = useFormAction(saveProduct, { warnUnsaved: true });
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(product));
  const errors = state?.fieldErrors ?? {};
  const previewName = title || "Product name";

  return (
    <form onSubmit={onSubmit} onInput={onInput} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_340px]">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="flex min-w-0 flex-col gap-6">
        <AdminCard title="Details">
          <Field label="Title" htmlFor="title" error={errors.title}>
            <input
              id="title"
              name="title"
              required
              maxLength={140}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              className={inputClass}
            />
          </Field>
          <Field
            label="URL"
            htmlFor="slug"
            error={errors.slug}
            hint={`dollneststore.co.uk${productPath(slug || "…")} · use keywords, e.g. silicone-reborn-baby-girl-18-inch`}
          >
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value.toLowerCase());
              }}
              className={inputClass}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            error={errors.description}
            hint="The first line is the intro. Put each detail on a new line (or separate with •) to show bullet points."
          >
            <textarea id="description" name="description" rows={10} defaultValue={product?.description} className={inputClass} />
          </Field>
        </AdminCard>

        <AdminCard title="Photos">
          {/* Remount when saved images change so pending uploads aren't submitted twice. */}
          <ImageUploader
            key={product?.images.map((img) => img.id).join(",") ?? "new"}
            images={product?.images ?? []}
            onChange={markDirty}
          />
        </AdminCard>

        <AdminCard title="Baby details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Collection" htmlFor="categorySlug" error={errors.categorySlug}>
              <select id="categorySlug" name="categorySlug" defaultValue={product?.categorySlug ?? ""} className={inputClass}>
                <option value="">No collection</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Baby" htmlFor="gender" error={errors.gender}>
              <select id="gender" name="gender" defaultValue={product?.gender ?? "girl"} className={inputClass}>
                {genders.map((g) => (
                  <option key={g} value={g}>
                    {g === "unisex" ? "Not specified" : g[0].toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Length (inches)" htmlFor="lengthIn" error={errors.lengthIn}>
              <input id="lengthIn" name="lengthIn" inputMode="decimal" defaultValue={product?.lengthIn ?? ""} className={inputClass} />
            </Field>
            <Field label="Weight (lbs)" htmlFor="weightLbs" error={errors.weightLbs}>
              <input id="weightLbs" name="weightLbs" inputMode="decimal" defaultValue={product?.weightLbs ?? ""} className={inputClass} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Search engine (SEO)">
          <SeoFields
            path={productPath(slug || "…")}
            defaultTitle={defaultProductTitle(previewName)}
            defaultDescription={defaultProductDescription({
              title: previewName,
              lengthIn: product?.lengthIn ?? null,
              weightLbs: product?.weightLbs ?? null,
              categorySlug: product?.categorySlug ?? null,
              pricePence: product?.pricePence ?? 0,
            })}
            title={product?.seoTitle}
            description={product?.seoDescription}
            errors={errors}
          />
        </AdminCard>
      </div>

      <div className="flex flex-col gap-6 xl:sticky xl:top-6">
        <AdminCard title="Price & stock">
          <Field label="Price (£)" htmlFor="price" error={errors.price}>
            <input
              id="price"
              name="price"
              required
              inputMode="decimal"
              placeholder="199.00"
              defaultValue={penceToPounds(product?.pricePence)}
              className={inputClass}
            />
          </Field>
          <Field label="Was price (£)" htmlFor="compareAt" error={errors.compareAt} hint="Optional — shows as a crossed-out price.">
            <input id="compareAt" name="compareAt" inputMode="decimal" defaultValue={penceToPounds(product?.compareAtPricePence)} className={inputClass} />
          </Field>
          <Field label="Stock" htmlFor="stockQty" error={errors.stockQty}>
            <input id="stockQty" name="stockQty" type="number" min={0} max={999} defaultValue={product?.stockQty ?? 1} className={inputClass} />
          </Field>
        </AdminCard>

        <AdminCard title="Visibility">
          <Field label="Status" htmlFor="status" error={errors.status}>
            <select id="status" name="status" defaultValue={product?.status ?? "draft"} className={inputClass}>
              {productStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2.5 text-sm font-semibold">
            <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} className="size-4 accent-lilac" />
            Feature on the home page
          </label>
          <Field label="Badge" htmlFor="badge" error={errors.badge} hint="e.g. New arrival, Best seller, Limited">
            <input id="badge" name="badge" maxLength={40} defaultValue={product?.badge ?? ""} className={inputClass} />
          </Field>
          <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder} hint="Lower numbers appear first.">
            <input id="sortOrder" name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} className={inputClass} />
          </Field>
          <Field label="Etsy listing ID" htmlFor="etsyListingId" error={errors.etsyListingId}>
            <input id="etsyListingId" name="etsyListingId" inputMode="numeric" defaultValue={product?.etsyListingId ?? ""} className={inputClass} />
          </Field>
        </AdminCard>

        <div className="hidden flex-col gap-3 xl:flex">
          <FormMessage state={state} />
          <button type="submit" disabled={pending} className={adminButton}>
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
          <SaveStatus dirty={dirty} pending={pending} />
        </div>
      </div>

      <MobileSaveBar state={state} pending={pending} dirty={dirty} label={product ? "Save" : "Create"} />
    </form>
  );
}
