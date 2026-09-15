"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-1.5 rounded-3xl border border-line bg-cream py-1 pr-1 pl-3.5">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <div className="absolute -left-[9999px]" aria-hidden>
          <label>
            Company
            <input name="company" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-[20px] bg-lilac px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Join ♡"}
        </button>
      </div>
      <p aria-live="polite" className={`text-xs ${state?.ok === false ? "text-rose" : "text-muted"}`}>
        {state?.message ?? (
          <>
            Monthly at most. Unsubscribe anytime. See our <Link href="/privacy" className="underline">privacy policy</Link>.
          </>
        )}
      </p>
    </form>
  );
}
