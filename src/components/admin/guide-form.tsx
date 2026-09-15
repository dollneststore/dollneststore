"use client";

import Image from "next/image";
import { useState } from "react";
import { saveGuide } from "@/lib/admin/actions/guides";
import { slugify } from "@/lib/format";
import { defaultGuideDescription, defaultGuideTitle, guidePath } from "@/lib/seo-defaults";
import { createClient } from "@/lib/supabase/browser";
import type { Guide } from "@/lib/types";
import { adminButton, AdminCard, Field, FormMessage, inputClass } from "./form-ui";
import { SeoFields } from "./seo-fields";
import { useFormAction } from "./use-form-action";

const BUCKET = "product-images";
const MAX_BYTES = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function GuideForm({ guide }: { guide?: Guide }) {
  const { state, pending, onSubmit } = useFormAction(saveGuide);
  const [title, setTitle] = useState(guide?.title ?? "");
  const [slug, setSlug] = useState(guide?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(guide));
  const [excerpt, setExcerpt] = useState(guide?.excerpt ?? "");
  const [cover, setCover] = useState<{ path: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const errors = state?.fieldErrors ?? {};

  async function uploadCover(file: File) {
    const ext = EXTENSIONS[file.type];
    if (!ext) return setUploadError("Use a JPG, PNG, WebP or AVIF image.");
    if (file.size > MAX_BYTES) return setUploadError("Images must be 8 MB or smaller.");
    setUploading(true);
    setUploadError(null);
    const path = `guides/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient()
      .storage.from(BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    setUploading(false);
    if (error) return setUploadError(error.message);
    setCover({ path, preview: URL.createObjectURL(file) });
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_340px]">
      {guide ? <input type="hidden" name="id" value={guide.id} /> : null}

      <div className="flex min-w-0 flex-col gap-6">
        <AdminCard title="Guide">
          <Field label="Title (H1)" htmlFor="title" error={errors.title}>
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
          <Field label="URL" htmlFor="slug" error={errors.slug} hint={`dollneststore.co.uk${guidePath(slug || "…")}`}>
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
          <Field label="Excerpt" htmlFor="excerpt" error={errors.excerpt} hint="One or two sentences shown on the guides page.">
            <textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              maxLength={300}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Article"
            htmlFor="body"
            error={errors.body}
            hint="## Heading · ### Sub-heading · - bullet · 1. numbered · **bold** · *italic* · [link text](/reborn-dolls/silicone) · > quote"
          >
            <textarea id="body" name="body" rows={22} defaultValue={guide?.body} className={`${inputClass} font-mono text-[13px] leading-relaxed`} />
          </Field>
        </AdminCard>

        <AdminCard title="Search engine (SEO)">
          <SeoFields
            path={guidePath(slug || "…")}
            defaultTitle={defaultGuideTitle(title || "Guide title")}
            defaultDescription={defaultGuideDescription({ excerpt: excerpt || "Add an excerpt to create the description automatically.", body: "" })}
            title={guide?.seoTitle}
            description={guide?.seoDescription}
            errors={errors}
          />
        </AdminCard>
      </div>

      <div className="flex flex-col gap-6 xl:sticky xl:top-6">
        <AdminCard title="Publishing">
          <Field label="Status" htmlFor="status" error={errors.status}>
            <select id="status" name="status" defaultValue={guide?.status ?? "draft"} className={inputClass}>
              <option value="draft">Draft — hidden</option>
              <option value="published">Published — live</option>
            </select>
          </Field>
          <Field label="Publish date" htmlFor="publishedAt" error={errors.publishedAt} hint="Leave empty to use today's date when publishing.">
            <input id="publishedAt" name="publishedAt" type="date" defaultValue={guide?.publishedAt?.slice(0, 10) ?? ""} className={inputClass} />
          </Field>
        </AdminCard>

        <AdminCard title="Cover image">
          <input type="hidden" name="coverPath" value={cover?.path ?? ""} />
          {cover ? (
            // Blob previews can't go through next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.preview} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" />
          ) : guide?.coverImageUrl ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-blush">
              <Image src={guide.coverImageUrl} alt="" fill sizes="300px" className="object-cover" />
            </div>
          ) : null}
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-lilac-line bg-cream px-4 py-6 text-center text-sm hover:border-lilac">
            <span className="font-bold text-lilac">{uploading ? "Uploading…" : cover || guide?.coverImageUrl ? "Replace image" : "Add cover image"}</span>
            <span className="text-xs text-muted">16:9 works best · up to 8 MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadCover(file);
              }}
            />
          </label>
          {guide?.coverImageUrl && !cover ? (
            <label className="flex items-center gap-2 text-xs font-semibold text-rose">
              <input type="checkbox" name="removeCover" /> Remove cover image
            </label>
          ) : null}
          {uploadError ? (
            <p role="alert" className="text-xs font-semibold text-rose">
              {uploadError}
            </p>
          ) : null}
        </AdminCard>

        <FormMessage state={state} />
        <button type="submit" disabled={pending || uploading} className={adminButton}>
          {pending ? "Saving…" : guide ? "Save guide" : "Create guide"}
        </button>
      </div>
    </form>
  );
}
