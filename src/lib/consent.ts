"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the visitor has agreed to analytics cookies. UK law (PECR) needs that agreement
 * *before* anything non-essential is stored on their device, so the answer starts as null
 * — "not asked yet" — and analytics only runs on "granted".
 */
export type Consent = "granted" | "denied" | null;

const STORAGE_KEY = "dollnest.consent.v1";

let consent: Consent = null;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    consent = saved === "granted" || saved === "denied" ? saved : null;
  } catch {
    consent = null;
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    readStorage();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    readStorage();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => {
  ensureLoaded();
  return consent;
};
const getServerSnapshot = (): Consent => null;

export function setConsent(next: Consent) {
  consent = next;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only, which is the safe way round.
  }
  listeners.forEach((listener) => listener());
}

export function useConsent() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
