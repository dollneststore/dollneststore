"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { ProductImage } from "@/lib/types";
import { inputClass } from "./form-ui";

const BUCKET = "product-images";
const MAX_BYTES = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

type Upload = { path: string; preview: string; name: string };

/**
 * Photo manager for a product:
 * - saved photos can be reordered by drag-and-drop (or the arrow buttons on touch screens);
 * - new photos upload straight from the browser to Supabase Storage (bucket policies only
 *   allow admins), so large files never hit Vercel's request size limit. The resulting paths
 *   are submitted with the product form and re-validated on the server.
 */
export function ImageUploader({ images, onChange }: { images: ProductImage[]; onChange?: () => void }) {
  const [ordered, setOrdered] = useState(images);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= ordered.length || from === to) return;
    setOrdered((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    onChange?.();
  }

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const added: Upload[] = [];
    const problems: string[] = [];

    for (const file of files) {
      const ext = EXTENSIONS[file.type];
      if (!ext) {
        problems.push(`${file.name}: use JPG, PNG, WebP or AVIF`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        problems.push(`${file.name}: larger than 8 MB`);
        continue;
      }
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (uploadError) {
        problems.push(`${file.name}: ${uploadError.message}`);
        continue;
      }
      added.push({ path, preview: URL.createObjectURL(file), name: file.name });
    }

    setUploads((current) => [...current, ...added]);
    setError(problems.length ? problems.join(" · ") : null);
    setBusy(false);
    if (added.length) onChange?.();
  }

  async function discard(upload: Upload) {
    setUploads((current) => current.filter((u) => u.path !== upload.path));
    URL.revokeObjectURL(upload.preview);
    await createClient().storage.from(BUCKET).remove([upload.path]);
  }

  const arrowButton =
    "grid size-7 place-items-center rounded-full border border-line bg-white text-sm font-bold hover:border-lilac hover:text-lilac disabled:opacity-30";

  return (
    <div className="flex flex-col gap-4">
      {ordered.length ? (
        <>
          <p className="text-xs text-muted">Drag photos to change the order — the first photo is the cover.</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ordered.map((img, index) => (
              <li
                key={img.id ?? img.url}
                draggable
                onDragStart={(event) => {
                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    move(dragIndex, index);
                    setDragIndex(index);
                  }
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`flex cursor-grab flex-col gap-2 rounded-2xl border p-2 transition active:cursor-grabbing ${
                  dragIndex === index ? "border-lilac opacity-50" : "border-line"
                }`}
              >
                <input type="hidden" name="imageId" value={img.id ?? ""} />
                <input type="hidden" name={`imagePosition:${img.id}`} value={index} />
                <div className="relative aspect-square overflow-hidden rounded-xl bg-blush">
                  <Image src={img.url} alt="" fill sizes="200px" className="pointer-events-none object-cover" />
                  {index === 0 ? (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold">Cover</span>
                  ) : null}
                </div>
                <input
                  name={`imageAlt:${img.id}`}
                  defaultValue={img.alt ?? ""}
                  placeholder="Describe the photo"
                  aria-label="Photo description (alt text)"
                  className={`${inputClass} py-1.5 text-xs`}
                />
                <div className="flex items-center justify-between gap-1 text-xs">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label="Move photo earlier" className={arrowButton}>
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, index + 1)}
                      disabled={index === ordered.length - 1}
                      aria-label="Move photo later"
                      className={arrowButton}
                    >
                      →
                    </button>
                  </div>
                  <label className="flex items-center gap-1.5 font-semibold text-rose">
                    <input type="checkbox" name="removeImage" value={img.id ?? ""} />
                    Remove
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {uploads.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {uploads.map((upload) => (
            <li key={upload.path} className="flex flex-col gap-2 rounded-2xl border border-dashed border-lilac-line p-2">
              {/* Blob previews can't go through next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={upload.preview} alt="" className="aspect-square w-full rounded-xl object-cover" />
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-sage-deep">New · saves with product</span>
                <button type="button" onClick={() => void discard(upload)} className="font-semibold text-rose">
                  Discard
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <input type="hidden" name="newImages" value={JSON.stringify(uploads.map((u) => u.path))} />

      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-lilac-line bg-cream px-4 py-8 text-center text-sm transition-colors hover:border-lilac">
        <span className="font-bold text-lilac">{busy ? "Uploading…" : "Add photos"}</span>
        <span className="text-xs text-muted">JPG, PNG, WebP or AVIF · up to 8 MB each</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={busy}
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void handleFiles(files);
          }}
        />
      </label>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-rose">
          {error}
        </p>
      ) : null}
    </div>
  );
}
