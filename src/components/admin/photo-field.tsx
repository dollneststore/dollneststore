"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { inputClass } from "./form-ui";

const BUCKET = "product-images";
const MAX_BYTES = 8 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * A single photo (review photo, collection cover): uploaded from the browser straight to
 * Supabase Storage, so it lives on our own servers and keeps working if the original is taken
 * down. Uploads go to the products/ folder because the bucket policy only allows admins to
 * write into products/ and guides/.
 *
 * `name` is the form field the server reads, so it stays the same on every card; `id` is what
 * the label points at, so it has to be unique when several of these share a page.
 */
export function PhotoField({
  name = "imageUrl",
  id,
  defaultValue = "",
  uploadLabel = "Upload a photo",
}: {
  name?: string;
  id?: string;
  defaultValue?: string;
  uploadLabel?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // This field holds its own state, so a plain form.reset() would leave the photo behind:
  // clear it when the surrounding form is reset after a successful save.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setUrl(defaultValue);
      setPreview(null);
      setError(null);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [defaultValue]);

  async function upload(file: File) {
    const ext = EXTENSIONS[file.type];
    if (!ext) return setError("Use a JPG, PNG, WebP or AVIF photo.");
    if (file.size > MAX_BYTES) return setError("That photo is larger than 8 MB.");

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    setBusy(false);
    if (uploadError) return setError(uploadError.message);

    setUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        {preview ? (
          <>
            {/* Blob previews can't go through next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="size-16 flex-none rounded-xl object-cover" />
          </>
        ) : null}
        <label className="flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-2 border-dashed border-lilac-line bg-cream px-4 py-3 text-center text-sm transition-colors hover:border-lilac">
          <span className="font-bold text-lilac">{busy ? "Uploading…" : url ? "Replace photo" : uploadLabel}</span>
          <span className="text-xs text-muted">JPG, PNG, WebP or AVIF · up to 8 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
        </label>
      </div>
      <input
        ref={inputRef}
        id={id ?? name}
        name={name}
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://… (or upload above)"
        aria-label="Photo link"
        className={`${inputClass} text-xs`}
      />
      {url ? (
        <button type="button" onClick={() => { setUrl(""); setPreview(null); }} className="w-fit text-xs font-semibold text-rose">
          Remove photo
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs font-semibold text-rose">
          {error}
        </p>
      ) : null}
    </div>
  );
}
