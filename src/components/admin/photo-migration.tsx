"use client";

import { useRef, useState } from "react";
import { copyEtsyPhotoBatch } from "@/lib/admin/actions/maintenance";
import { adminButton, adminButtonSecondary } from "./form-ui";

export function PhotoMigration({ initialRemaining }: { initialRemaining: number }) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [copied, setCopied] = useState(0);
  const [failed, setFailed] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stop = useRef(false);
  // The bar measures progress against the largest count we've seen, so adding photos
  // mid-run can't push it out of range.
  const total = Math.max(initialRemaining, remaining + copied, 1);
  const percent = Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)));

  async function run() {
    stop.current = false;
    setRunning(true);
    setError(null);
    // Each call copies a few photos; repeat until the server says none are left.
    for (let guard = 0; guard < 500 && !stop.current; guard += 1) {
      let result;
      try {
        result = await copyEtsyPhotoBatch();
      } catch {
        setError("The connection dropped. Press “Continue” to carry on where it stopped.");
        break;
      }
      setCopied((n) => n + result.copied);
      setFailed((n) => n + result.failed);
      setRemaining(result.remaining);
      if (result.error) {
        setError(result.error);
        break;
      }
      if (result.remaining === 0) break;
      // Nothing copied in a whole batch: the rest can't be downloaded (removed from Etsy).
      if (result.copied === 0) {
        if (result.failed > 0) {
          setError(
            `${result.failed} photo${result.failed === 1 ? "" : "s"} can't be downloaded from Etsy any more — most likely the listing was deleted. Replace them on the product page.`,
          );
        }
        break;
      }
    }
    setRunning(false);
  }

  if (initialRemaining === 0 && copied === 0) {
    return <p className="text-sm font-semibold text-sage-deep">All photos are stored on our own servers ♡</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {remaining > 0
          ? `${remaining} photo${remaining === 1 ? "" : "s"} still load from Etsy. Copy them here so the shop keeps working if a listing is removed from Etsy.`
          : "All photos are stored on our own servers ♡"}
      </p>

      {(running || copied > 0 || failed > 0) && (
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
            {copied} copied{failed ? ` · ${failed} failed` : ""} · {remaining} to go
            {running ? " · working…" : ""}
          </p>
        </div>
      )}

      {error ? (
        <p role="alert" className="text-xs font-semibold text-rose">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void run()} disabled={running || remaining === 0} className={adminButton}>
          {running ? "Copying…" : copied > 0 || failed > 0 ? "Continue" : "Copy photos to our storage"}
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
