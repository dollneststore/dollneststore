"use client";

import { useActionState, useEffect, useRef } from "react";
import { applyDiscountCode, type DiscountState } from "@/app/actions/discount";
import { discountActions, useDiscount } from "./use-discount";

/**
 * Discount code entry. The code is checked on the server (the codes table can't be read by
 * visitors), and the result is remembered so the basket and checkout agree.
 */
export function DiscountField() {
  const { discount, clear } = useDiscount();
  const verified = useRef(false);

  // The basket lives in this browser, so a stored discount is checked with the server once per
  // page: the server's percentage replaces whatever is in storage, and a code that is no longer
  // usable is dropped. Without this, an edited localStorage value would be believed.
  useEffect(() => {
    if (!discount || verified.current) return;
    verified.current = true;
    const form = new FormData();
    form.set("code", discount.code);
    void applyDiscountCode(null, form).then((result) => {
      if (result?.ok && result.code && result.percentOff) {
        discountActions.apply({ code: result.code, percentOff: result.percentOff });
      } else {
        discountActions.clear();
      }
    });
  }, [discount]);

  const [state, formAction, pending] = useActionState(async (prev: DiscountState, formData: FormData) => {
    const result = await applyDiscountCode(prev, formData);
    if (result?.ok && result.code && result.percentOff) {
      discountActions.apply({ code: result.code, percentOff: result.percentOff });
    }
    return result;
  }, null);

  if (discount) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-sage/50 px-4 py-3 text-sm">
        <span>
          <b>{discount.code}</b> · {discount.percentOff}% off applied ♡
        </span>
        <button type="button" onClick={clear} className="text-xs font-bold text-muted hover:text-rose">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="discount-code" className="text-xs font-bold uppercase tracking-[.12em] text-muted">
        Discount code
      </label>
      <div className="flex gap-2">
        <input
          id="discount-code"
          name="code"
          maxLength={24}
          autoComplete="off"
          placeholder="WELCOME10"
          aria-invalid={state && !state.ok ? true : undefined}
          aria-describedby={state && !state.ok ? "discount-error" : undefined}
          className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2 text-sm uppercase outline-none focus:border-lilac"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-lilac px-4 py-2 text-sm font-bold text-white hover:bg-[#7a5a9b] disabled:opacity-60"
        >
          {pending ? "Checking…" : "Apply"}
        </button>
      </div>
      {state && !state.ok ? (
        <p id="discount-error" role="alert" className="text-xs font-semibold text-rose">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
