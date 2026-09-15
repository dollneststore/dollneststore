import Link from "next/link";
import { Suspense } from "react";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";
import { signOut } from "@/lib/admin/actions/auth";
import { getAdmin } from "@/lib/auth";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:flex-none lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 p-4 lg:p-6">
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
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}

async function AdminEmail() {
  const admin = await getAdmin();
  return admin ? <p className="truncate text-xs text-muted">{admin.email}</p> : null;
}
