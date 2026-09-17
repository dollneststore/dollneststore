import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { getAdminCategories } from "@/lib/admin/queries";
import { categoryPath } from "@/lib/seo-defaults";

export const metadata: Metadata = { title: "Collections" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Collections"
        description="Each collection has its own SEO page, e.g. /reborn-dolls/silicone."
        action={
          <Link href="/admin/categories/new" className={adminButton}>
            New collection
          </Link>
        }
      />
      <Suspense fallback={<LoadingBlock />}>
        <CategoryList />
      </Suspense>
    </>
  );
}

async function CategoryList() {
  const categories = await getAdminCategories();
  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[.08em] text-muted">
          <tr>
            <th className="p-4 font-bold">Collection</th>
            <th className="p-4 font-bold">SEO title</th>
            <th className="p-4 font-bold">Page text</th>
            <th className="p-4 font-bold">Order</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {categories.map((c) => (
            <tr key={c.slug} className="hover:bg-cream">
              <td className="p-3">
                <Link href={`/admin/categories/${c.slug}`} className="flex items-center gap-3 font-bold hover:text-lilac">
                  <span className="relative size-12 flex-none overflow-hidden rounded-xl bg-blush">
                    {c.imageUrl ? <Image src={c.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : null}
                  </span>
                  <span>
                    {c.name}
                    <span className="block text-xs font-normal text-muted">{categoryPath(c.slug)}</span>
                    {/* Without a cover the shop borrows a product photo, so the card is never empty. */}
                    {c.imageUrl ? null : (
                      <span className="block text-xs font-normal text-dusty">No cover — a product photo is used</span>
                    )}
                  </span>
                </Link>
              </td>
              <td className="p-4 text-xs">{c.seoTitle ? "Custom" : <span className="text-muted">Automatic</span>}</td>
              <td className="p-4 text-xs">{c.intro ? "Custom" : <span className="text-muted">Built-in</span>}</td>
              <td className="p-4">{c.sortOrder}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
