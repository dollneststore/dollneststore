"use client";

import { useEffect, useRef } from "react";
import { cartActions } from "./use-cart";
import { discountActions } from "./use-discount";

/** Empties the basket once a payment has gone through, so a refresh can't reorder. */
export function ClearBasket() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    cartActions.clear();
    discountActions.clear();
  }, []);
  return null;
}
