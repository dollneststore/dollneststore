"use client";

import { useSyncExternalStore } from "react";
import type { CartItem, CartProduct } from "@/lib/types";

// The basket lives in localStorage (no cookies needed). Prices here are for
// display only — checkout must always re-price items from the database.

const STORAGE_KEY = "dollnest.basket.v1";
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const i = value as Record<string, unknown>;
  return (
    typeof i.productId === "string" &&
    typeof i.slug === "string" &&
    typeof i.title === "string" &&
    Number.isInteger(i.pricePence) &&
    Number.isInteger(i.qty) &&
    (i.qty as number) > 0 &&
    Number.isInteger(i.maxQty) &&
    (i.image === null || typeof i.image === "string")
  );
}

function readStorage() {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    items = Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    readStorage();
  }
}

function commit(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); the basket still works for this tab.
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
  return items;
};
const getServerSnapshot = () => EMPTY;

const clampQty = (qty: number, maxQty: number) => Math.max(0, Math.min(Math.max(1, maxQty), Math.floor(qty)));

export const cartActions = {
  add(product: CartProduct, qty = 1) {
    ensureLoaded();
    const existing = items.find((i) => i.productId === product.productId);
    if (existing) {
      commit(
        items.map((i) =>
          i.productId === product.productId ? { ...product, qty: clampQty(i.qty + qty, product.maxQty) } : i,
        ),
      );
    } else {
      commit([...items, { ...product, qty: clampQty(qty, product.maxQty) }]);
    }
  },
  setQty(productId: string, qty: number) {
    ensureLoaded();
    commit(
      items
        .map((i) => (i.productId === productId ? { ...i, qty: clampQty(qty, i.maxQty) } : i))
        .filter((i) => i.qty > 0),
    );
  },
  remove(productId: string) {
    ensureLoaded();
    commit(items.filter((i) => i.productId !== productId));
  },
  clear() {
    commit(EMPTY);
  },
};

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = current.reduce((total, i) => total + i.qty, 0);
  const subtotalPence = current.reduce((total, i) => total + i.qty * i.pricePence, 0);
  return { items: current, count, subtotalPence, ...cartActions };
}

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true once the basket has been read in the browser. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
