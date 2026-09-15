"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/lib/admin/form-state";

/**
 * Like `<form action={...}>` but keeps the typed values after submit
 * (React resets uncontrolled forms after an action), so validation errors
 * don't wipe the admin's input.
 */
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, null);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
  return { state, pending, onSubmit };
}
