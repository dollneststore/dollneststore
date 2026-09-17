"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { buttonPrimary } from "@/components/ui/styles";
import { useConsent } from "@/lib/consent";
import type { PopupSettings } from "@/lib/types";

const STORAGE_KEY = "dollnest.popup.v1";
const DELAY_MS = 7000;
const HIDE_FOR_DAYS = 30;
// Never interrupt someone who is already buying.
const QUIET_PATHS = ["/basket", "/checkout"];
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Welcome discount pop-up. Content and code come from /admin/settings, so it can be changed
 * or switched off without a deploy. The dismissal is remembered in this browser only.
 */
export function WelcomePopup({ popup }: { popup: PopupSettings }) {
  const pathname = usePathname();
  const consent = useConsent();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const quiet = QUIET_PATHS.some((p) => pathname?.startsWith(p));

  const close = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Nothing to do: the pop-up will appear again on the next visit.
    }
  }, []);

  useEffect(() => {
    // One thing at a time: the cookie choice is asked first, and the law requires an answer
    // before anything else is stored on the visitor's device.
    if (!popup.enabled || quiet || consent === null) return;
    let seenAt = 0;
    try {
      seenAt = Number(window.localStorage.getItem(STORAGE_KEY)) || 0;
    } catch {
      // Storage can be blocked; then the pop-up simply shows again next time.
    }
    if (Date.now() - seenAt < HIDE_FOR_DAYS * 86400_000) return;
    const timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [popup.enabled, quiet, consent]);

  // While it is open it behaves like a proper dialog: the page behind can't scroll,
  // Tab stays inside it, Escape closes it and focus goes back where it came from.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = bodyOverflow;
      previous?.focus?.();
    };
  }, [open, close]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(popup.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  // `quiet` also hides an already-open pop-up, so navigating to the basket closes it.
  if (!popup.enabled || !open || quiet) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-cocoa/30 p-4 backdrop-blur-[2px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-heading"
        tabIndex={-1}
        className="relative w-full max-w-[420px] rounded-[28px] bg-[linear-gradient(160deg,var(--color-blush),var(--color-lilac-soft))] p-[clamp(22px,4vw,34px)] text-center shadow-[0_24px_60px_rgba(91,63,46,.22)] outline-none"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/80 hover:bg-white"
        >
          <CloseIcon />
        </button>

        <p className="text-xs font-bold uppercase tracking-[.16em] text-lilac">Dollnest</p>
        <h2 id="popup-heading" className="mt-2 font-serif text-[clamp(26px,4vw,34px)] leading-tight font-medium text-pretty">
          {popup.heading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6b5a60]">{popup.body}</p>

        <div className="mt-5 rounded-[18px] border-2 border-dashed border-lilac-line bg-white/85 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">Your code</p>
          <p className="font-serif text-[30px] font-semibold tracking-[2px] text-lilac">{popup.code}</p>
          <button type="button" onClick={() => void copy()} className="mt-1 text-xs font-bold text-lilac hover:underline">
            {copied ? "Copied ♡" : "Copy code"}
          </button>
        </div>

        <Link href="/reborn-dolls" onClick={close} className={`${buttonPrimary} mt-5 w-full justify-center`}>
          Meet our babies ♡
        </Link>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Enter the code in your basket. One code per order, on full-price babies.
        </p>
      </div>
    </div>
  );
}
