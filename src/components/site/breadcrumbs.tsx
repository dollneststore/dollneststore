import Link from "next/link";
import { JsonLd } from "./json-ld";
import { breadcrumbLd } from "@/lib/seo";

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
      <JsonLd data={breadcrumbLd(items)} />
      <ol className="flex flex-wrap gap-1.5">
        {items.map((item, index) =>
          index === items.length - 1 ? (
            <li key={item.path} aria-current="page" className="text-cocoa">
              {item.name}
            </li>
          ) : (
            <li key={item.path}>
              <Link href={item.path} className="hover:text-lilac">
                {item.name}
              </Link>{" "}
              /
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
