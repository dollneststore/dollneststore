import type { FormState } from "@/lib/admin/form-state";
import type { OrderStatus } from "@/lib/types";

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-lilac focus:ring-2 focus:ring-lilac-soft disabled:bg-line-soft";

export const adminButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-lilac px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#7a5a9b] disabled:cursor-not-allowed disabled:opacity-60";

export const adminButtonSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold transition-colors hover:border-lilac hover:text-lilac";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-4xl font-medium">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[20px] border border-line bg-white p-5 sm:p-6 ${className}`}>
      {title ? <h2 className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-lilac">{title}</h2> : null}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-[.08em] text-muted">
        {label}
      </label>
      {children}
      {error?.length ? (
        <p className="mt-1 text-xs font-semibold text-rose" role="alert">
          {error[0]}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${state.ok ? "bg-sage text-sage-deep" : "bg-blush text-rose"}`}
    >
      {state.message}
    </p>
  );
}

const statusTones: Record<OrderStatus, string> & Record<string, string> = {
  active: "bg-sage text-sage-deep",
  published: "bg-sage text-sage-deep",
  draft: "bg-peach text-peach-deep",
  sold_out: "bg-blush text-rose",
  archived: "bg-line text-muted",
  pending: "bg-peach text-peach-deep",
  paid: "bg-sky text-sky-deep",
  processing: "bg-lilac-soft text-lilac",
  dispatched: "bg-sage text-sage-deep",
  delivered: "bg-sage text-sage-deep",
  cancelled: "bg-line text-muted",
  refunded: "bg-blush text-rose",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTones[status as OrderStatus] ?? "bg-line text-muted";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${tone}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function LoadingBlock() {
  return <div className="h-64 animate-pulse rounded-[20px] bg-white" aria-label="Loading" />;
}

export function SaveStatus({ dirty, pending }: { dirty: boolean; pending: boolean }) {
  if (!dirty || pending) return null;
  return <p className="text-center text-xs font-semibold text-peach-deep">● Unsaved changes</p>;
}

/** Fixed save bar for phones and tablets; the desktop layout keeps its sidebar button. Place inside the <form>. */
export function MobileSaveBar({ state, pending, dirty, label }: { state: FormState; pending: boolean; dirty: boolean; label: string }) {
  const message = pending ? "Saving…" : state && !state.ok ? state.message : dirty ? "● Unsaved changes" : (state?.message ?? "");
  const tone = state && !state.ok && !pending ? "text-rose" : dirty ? "text-peach-deep" : "text-sage-deep";
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md xl:hidden print:hidden">
      <p aria-live="polite" className={`min-w-0 flex-1 truncate text-xs font-semibold ${tone}`}>
        {message}
      </p>
      <button type="submit" disabled={pending} className={`${adminButton} flex-none`}>
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}
