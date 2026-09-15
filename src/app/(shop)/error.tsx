"use client";

import Link from "next/link";
import { buttonPrimary, container } from "@/components/ui/styles";

export default function ShopError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={`${container} py-24 text-center`}>
      <p className="font-serif text-4xl">Oh dear, something went wrong ♡</p>
      <p className="mt-3 text-muted">Please try again, or message us on WhatsApp if it keeps happening.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className={buttonPrimary}>
          Try again
        </button>
        <Link href="/" className="px-5 py-[15px] font-bold text-lilac">
          Go home
        </Link>
      </div>
    </div>
  );
}
