import Link from "next/link";
import { Suspense } from "react";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";
import { LoadingBlock } from "@/components/admin/form-ui";
import { signOut } from "@/lib/admin/actions/auth";
import { getAdmin, requireAdmin } from "@/lib/auth";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row print:block">
      <aside className="sticky top-0 z-20 border-b border-line bg-white lg:flex lg:h-dvh lg:w-60 lg:flex-none lg:flex-col lg:border-r lg:border-b-0 print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:p-6">
          <Link href="/admin" className="font-serif text-2xl font-semibold text-lilac">
            Dollnest
            <span className="ml-1.5 align-middle font-sans text-[10px] font-bold uppercase tracking-[.16em] text-muted">Admin</span>
          </Link>
          <form action={signOut} className="lg:hidden">
            <button type="submit" className="text-sm font-semibold text-muted hover:text-rose">
              Sign out
            </button>
          </form>
        </div>
        <Suspense fallback={<AdminNavLinks pathname={null} />}>
          <AdminNav />
        </Suspense>
        <div className="mt-auto hidden flex-col gap-2 border-t border-line p-6 text-sm lg:flex">
          <Suspense fallback={null}>
            <AdminEmail />
          </Suspense>
          <Link href="/" target="_blank" className="font-semibold text-lilac hover:underline">
            View shop ↗
          </Link>
          <form action={signOut}>
            <button type="submit" className="font-semibold text-muted hover:text-rose">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      {/* Extra bottom padding below xl leaves room for the fixed mobile save bar. */}
      <main className="min-w-0 flex-1 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-10 lg:pb-28 xl:pb-10 print:p-0">
        <Suspense fallback={<LoadingBlock />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}

/** Panel chrome is only shown to verified admins (pages and actions re-check on their own). */
async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}

async function AdminEmail() {
  const admin = await getAdmin();
  return admin ? <p className="truncate text-xs text-muted">{admin.email}</p> : null;
}
