"use client";

import { useRef, useState } from "react";
import { copyEtsyPhotoBatch, type StuckPhoto } from "@/lib/admin/actions/maintenance";
import { adminButton, adminButtonSecondary } from "./form-ui";

const keyOf = (photo: StuckPhoto) => `${photo.kind}:${photo.id}`;

export function PhotoMigration({ initialRemaining }: { initialRemaining: number }) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [copied, setCopied] = useState(0);
  const [stuck, setStuck] = useState<StuckPhoto[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stop = useRef(false);
  // Photos Etsy no longer serves stay in `remaining` forever, so they are counted separately
  // and the run is finished once everything else has been copied.
  const known = useRef(new Map<string, StuckPhoto>());
  const pending = Math.max(0, remaining - stuck.length);
  const total = Math.max(initialRemaining, pending + copied + stuck.length, 1);
  const percent = Math.min(100, Math.max(0, Math.round(((total - pending) / total) * 100)));

  async function run() {
    stop.current = false;
    setRunning(true);
    setError(null);
    // Each call copies a few photos; repeat until nothing copyable is left.
    for (let guard = 0; guard < 500 && !stop.current; guard += 1) {
      const skipped = [...known.current.values()];
      const skip = {
        image: skipped.filter((p) => p.kind === "image").map((p) => p.id),
        category: skipped.filter((p) => p.kind === "category").map((p) => p.id),
        review: skipped.filter((p) => p.kind === "review").map((p) => p.id),
      };

      let result;
      try {
        result = await copyEtsyPhotoBatch(skip);
      } catch {
        setError("The connection dropped. Press “Continue” to carry on where it stopped.");
        break;
      }

      for (const photo of result.stuck) known.current.set(keyOf(photo), photo);
      setStuck([...known.current.values()]);
      setCopied((n) => n + result.copied);
      setRemaining(result.remaining);

      if (result.error) {
        setError(result.error);
        break;
      }
      // Done when everything left is a photo Etsy no longer serves, or when a batch
      // neither copied nor attempted anything.
      if (result.remaining - known.current.size <= 0) break;
      if (result.copied === 0 && result.stuck.length === 0) break;
    }
    setRunning(false);
  }

  if (initialRemaining === 0 && copied === 0) {
    return <p className="text-sm font-semibold text-sage-deep">All photos are stored on our own servers ♡</p>;
  }

  const stuckNote =
    stuck.length > 0
      ? `${stuck.length} photo${stuck.length === 1 ? "" : "s"} can no longer be downloaded from Etsy — most likely the listing was deleted. Open the product or review and upload a new photo.`
      : null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {pending > 0
          ? `${pending} photo${pending === 1 ? "" : "s"} still load from Etsy. Copy them here so the shop keeps working if a listing is removed from Etsy.`
          : "Everything that could be copied is stored on our own servers ♡"}
      </p>

      {(running || copied > 0 || stuck.length > 0) && (
        <div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-lilac transition-[width] duration-300" style={{ width: `${percent}%` }} />
          </div>
          <p aria-live="polite" className="mt-2 text-xs text-muted">
            {copied} copied{stuck.length ? ` · ${stuck.length} unavailable` : ""} · {pending} to go
            {running ? " · working…" : ""}
          </p>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs font-semibold text-rose">
          {error}
        </p>
      ) : null}

      {stuckNote ? <p className="text-xs font-semibold text-dusty">{stuckNote}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void run()} disabled={running || pending === 0} className={adminButton}>
          {running ? "Copying…" : copied > 0 || stuck.length > 0 ? "Continue" : "Copy photos to our storage"}
        </button>
        {running ? (
          <button type="button" onClick={() => (stop.current = true)} className={adminButtonSecondary}>
            Stop
          </button>
        ) : null}
      </div>
      <p className="text-xs text-muted">Keep this page open while it runs. You can stop and continue later — nothing is copied twice.</p>
    </div>
  );
}
