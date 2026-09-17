"use client";

import { useSyncExternalStore } from "react";

// The discount the customer has entered. Like the basket it lives in localStorage, and like
// the basket it is for display only: when Stripe goes live the server must check the code
// again and recompute the total before taking any money.

export type AppliedDiscount = { code: string; percentOff: number };

const STORAGE_KEY = "dollnest.discount.v1";

let applied: AppliedDiscount | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function isDiscount(value: unknown): value is AppliedDiscount {
  if (!value || typeof value !== "object") return false;
  const d = value as Record<string, unknown>;
  return typeof d.code === "string" && Number.isInteger(d.percentOff) && (d.percentOff as number) > 0 && (d.percentOff as number) <= 90;
}

function readStorage() {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    applied = isDiscount(parsed) ? parsed : null;
  } catch {
    applied = null;
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    readStorage();
  }
}

function commit(next: AppliedDiscount | null) {
  applied = next;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the discount still applies in this tab.
  }
  listeners.forEach((listener) => listener());
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
  return applied;
};
const getServerSnapshot = () => null;

export const discountActions = {
  apply(discount: AppliedDiscount) {
    commit(discount);
  },
  clear() {
    commit(null);
  },
};

/** Whole pence off, rounded to the nearest penny. */
export function discountPence(subtotalPence: number, discount: AppliedDiscount | null) {
  return discount ? Math.round((subtotalPence * discount.percentOff) / 100) : 0;
}

export function useDiscount() {
  const discount = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { discount, ...discountActions };
}
