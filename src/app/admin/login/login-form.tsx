"use client";

import { useSearchParams } from "next/navigation";
import { adminButton, Field, FormMessage, inputClass } from "@/components/admin/form-ui";
import { useFormAction } from "@/components/admin/use-form-action";
import { signIn } from "@/lib/admin/actions/auth";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const { state, pending, onSubmit } = useFormAction(signIn);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className={`${adminButton} w-full py-3`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
