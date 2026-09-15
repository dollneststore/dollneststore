"use client";

import { adminButton } from "./form-ui";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={adminButton}>
      {label}
    </button>
  );
}
