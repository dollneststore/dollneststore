"use client";

import Link from "next/link";
import { adminButton, adminButtonSecondary } from "@/components/admin/form-ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-md rounded-[20px] border border-line bg-white p-8 text-center">
        <p className="font-serif text-3xl">Something went wrong</p>
        <p className="mt-2 text-sm text-muted">
          The page couldn&apos;t load its data. Try again — if it keeps happening, check that Supabase is reachable.
        </p>
        {error.digest ? <p className="mt-2 text-xs text-muted">Reference: {error.digest}</p> : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className={adminButton}>
            Try again
          </button>
          <Link href="/admin" className={adminButtonSecondary}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
