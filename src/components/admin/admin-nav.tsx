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
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/settings", label: "Settings" },
];

const isActive = (pathname: string | null, href: string) =>
  pathname !== null && (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

/** Rendered without an active state while the pathname streams in (Suspense fallback). */
export function AdminNavLinks({ pathname }: { pathname: string | null }) {
  const current = links.find((link) => isActive(pathname, link.href));
  const renderLinks = (className: string, onPhone: boolean) => (
    <nav aria-label={onPhone ? "Admin menu" : "Admin"} className={className}>
      {links.map((link) => {
        const active = isActive(pathname, link.href);
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

  return (
    <>
      {/* Phones/tablets: a compact dropdown; it remounts (closes) after each navigation. */}
      <details key={pathname ?? "loading"} className="group border-t border-line lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
          <span>
            <span className="text-muted">Menu · </span>
            {current?.label ?? "Admin"}
          </span>
          <span className="text-lilac transition-transform group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        {renderLinks("grid grid-cols-2 gap-1 px-3 pb-3 text-sm font-semibold", true)}
      </details>
      {renderLinks("hidden flex-col gap-1 px-4 text-sm font-semibold lg:flex", false)}
    </>
  );
}
