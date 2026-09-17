"use client";

import Link from "next/link";
import { setConsent, useConsent } from "@/lib/consent";

const button = "rounded-full px-4 py-2 text-sm font-bold transition-transform hover:scale-[1.03]";

/**
 * Asks before any analytics cookie is set, as PECR requires. It sits above the mobile bottom
 * bar, and "No thanks" is as easy to choose as "Yes" — a nudged choice isn't consent.
 */
export function ConsentBanner() {
  const consent = useConsent();
  if (consent !== null) return null;

  return (
    <div
      role="region"
      aria-label="Cookie choice"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/98 px-4 pt-4 pb-[max(16px,calc(env(safe-area-inset-bottom)+76px))] backdrop-blur-md lg:pb-4"
    >
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          We&apos;d like to use Google Analytics to see which babies people look at, so we can make the shop better.
          It&apos;s entirely your choice — the shop works the same either way.{" "}
          <Link href="/cookies" className="font-semibold text-lilac hover:underline">
            Our cookie policy
          </Link>
        </p>
        <div className="flex flex-none gap-2">
          <button type="button" onClick={() => setConsent("denied")} className={`${button} border border-line bg-white`}>
            No thanks
          </button>
          <button type="button" onClick={() => setConsent("granted")} className={`${button} bg-lilac text-white`}>
            Yes, that&apos;s fine
          </button>
        </div>
      </div>
    </div>
  );
}

/** Lets someone change their mind later; used on the cookie policy page. */
export function ConsentChoice() {
  const consent = useConsent();

  return (
    <div className="not-prose my-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm">
      <span>
        Your choice right now:{" "}
        <b>{consent === "granted" ? "analytics allowed" : consent === "denied" ? "analytics switched off" : "not chosen yet"}</b>
      </span>
      {consent === "granted" ? (
        <button type="button" onClick={() => setConsent("denied")} className={`${button} border border-line bg-white`}>
          Switch analytics off
        </button>
      ) : (
        <button type="button" onClick={() => setConsent("granted")} className={`${button} bg-lilac text-white`}>
          Allow analytics
        </button>
      )}
    </div>
  );
}
