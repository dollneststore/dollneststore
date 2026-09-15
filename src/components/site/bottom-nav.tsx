"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", glyph: "♡", label: "Home" },
  { href: "/shop", glyph: "✿", label: "Shop" },
  { href: "/#reviews", glyph: "★", label: "Reviews" },
  { href: "/contact", glyph: "❦", label: "Contact" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] text-[10px] font-bold uppercase tracking-[.1em] backdrop-blur-md lg:hidden"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : !item.href.includes("#") && pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 p-1.5 ${active ? "text-rose" : ""}`}
          >
            <span className="text-lg leading-none" aria-hidden>
              {item.glyph}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
