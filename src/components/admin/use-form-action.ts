"use client";

import { startTransition, useActionState, useCallback, useEffect, useState, type FormEvent } from "react";
import type { FormState } from "@/lib/admin/form-state";

const LEAVE_MESSAGE = "You have unsaved changes. Leave this page without saving?";

/**
 * Like `<form action={...}>` but keeps the typed values after submit (React resets
 * uncontrolled forms after an action), tracks unsaved changes and can warn before leaving.
 *
 * Wire it up with `<form onSubmit={onSubmit} onInput={onInput}>`; call `markDirty()` for
 * changes that don't fire input events (e.g. drag-and-drop reordering).
 */
export function useFormAction(
  action: (prev: FormState, formData: FormData) => Promise<FormState>,
  options: { warnUnsaved?: boolean } = {},
) {
  const [state, dispatch, pending] = useActionState(action, null);
  const [edits, setEdits] = useState(0);
  const [submittedEdits, setSubmittedEdits] = useState(-1);
  const dirty = edits > 0 && !(state?.ok && !pending && submittedEdits === edits);
  const markDirty = useCallback(() => setEdits((count) => count + 1), []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmittedEdits(edits);
    startTransition(() => dispatch(formData));
  };

  const warn = options.warnUnsaved === true && dirty;
  useEffect(() => {
    if (!warn) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    // Client-side navigation doesn't fire beforeunload, so intercept link clicks too.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (anchor.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [warn]);

  return { state, pending, onSubmit, onInput: markDirty, markDirty, dirty };
}
