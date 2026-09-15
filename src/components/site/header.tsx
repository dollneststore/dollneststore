"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/use-cart";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon } from "@/components/icons";
import { container } from "@/components/ui/styles";
import { site } from "@/lib/site";

const navLinks = [
  { href: "/", label: "♡ Home" },
  { href: "/reborn-dolls", label: "Reborn dolls" },
  { href: "/#collections", label: "Collections" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/guides", label: "Guides" },
  { href: "/contact", label: "Contact" },
];

const iconButton = "relative grid size-10 place-items-center rounded-full transition-colors hover:bg-blush";

/** Header with the active link highlighted. Needs a Suspense boundary (usePathname on dynamic routes). */
export function Header() {
  return <HeaderShell pathname={usePathname()} />;
}

/** Also used as the Suspense fallback, without an active link. */
export function HeaderShell({ pathname }: { pathname: string | null }) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) =>
    pathname !== null && (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
      <div className={`${container} flex h-[72px] items-center justify-between gap-4`}>
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <Image
            src={site.logo}
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-full border-2 border-rose-soft object-cover"
          />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[28px] font-semibold text-lilac">Dollnest</span>
            <span className="mt-[3px] hidden whitespace-nowrap text-[10px] uppercase tracking-[.14em] text-[#a08a8f] min-[420px]:block">
              {site.tagline}
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden gap-1.5 whitespace-nowrap text-sm font-semibold lg:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 transition-colors ${active ? "bg-blush text-rose" : "hover:text-lilac"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href="/reborn-dolls" aria-label="Search reborn dolls" className={iconButton}>
            <SearchIcon />
          </Link>
          <Link href="/basket" aria-label={`Basket, ${count} ${count === 1 ? "item" : "items"}`} className={iconButton}>
            <BagIcon />
            {count > 0 ? (
              <span className="absolute right-0.5 top-0.5 rounded-[9px] bg-rose px-[5px] py-px text-[10px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={`${iconButton} lg:hidden`}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="flex flex-col border-t border-line bg-white px-[clamp(16px,4vw,40px)] pb-4 pt-2 text-base font-semibold lg:hidden"
        >
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className={`py-3.5 ${index < navLinks.length - 1 ? "border-b border-line-soft" : ""} ${isActive(link.href) ? "text-rose" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
