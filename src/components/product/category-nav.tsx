import Link from "next/link";
import { categoryPath, shopPath } from "@/lib/seo-defaults";
import type { Category } from "@/lib/types";

const chip = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-bold transition-colors ${
    active ? "bg-lilac text-white" : "border border-line bg-white hover:border-lilac hover:text-lilac"
  }`;

export function CategoryNav({ categories, active }: { categories: Category[]; active?: string }) {
  return (
    <nav aria-label="Collections" className="flex flex-wrap gap-2">
      <Link href={shopPath} className={chip(!active)} aria-current={!active ? "page" : undefined}>
        All babies
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={categoryPath(c.slug)}
          className={chip(active === c.slug)}
          aria-current={active === c.slug ? "page" : undefined}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
