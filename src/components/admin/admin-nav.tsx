"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Collections" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/guides", label: "Guides" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

/** Rendered without an active state while the pathname streams in (Suspense fallback). */
export function AdminNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-4 pb-3 text-sm font-semibold lg:flex-col lg:px-4 lg:pb-0">
      {links.map((link) => {
        const active = pathname !== null && (link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl px-3.5 py-2.5 whitespace-nowrap transition-colors ${
              active ? "bg-lilac-soft text-lilac" : "hover:bg-cream hover:text-lilac"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
