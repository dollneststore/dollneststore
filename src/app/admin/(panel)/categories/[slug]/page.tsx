import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryForm } from "@/components/admin/category-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { adminButtonSecondary, LoadingBlock } from "@/components/admin/form-ui";
import { deleteCategory } from "@/lib/admin/actions/categories";
import { getAdminCategory } from "@/lib/admin/queries";
import { categoryPath } from "@/lib/seo-defaults";

export const metadata: Metadata = { title: "Edit collection" };

export default function EditCategoryPage({ params }: PageProps<"/admin/categories/[slug]">) {
  return (
    <>
      <Link href="/admin/categories" className="text-sm font-semibold text-lilac hover:underline">
        ← Collections
      </Link>
      <Suspense fallback={<LoadingBlock />}>
        <EditCategory params={params} />
      </Suspense>
    </>
  );
}

async function EditCategory({ params }: Pick<PageProps<"/admin/categories/[slug]">, "params">) {
  const { slug } = await params;
  const category = await getAdminCategory(slug);
  if (!category) notFound();

  return (
    <>
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl font-medium">{category.name}</h1>
        <div className="flex gap-2">
          <Link href={categoryPath(category.slug)} target="_blank" className={adminButtonSecondary}>
            View page ↗
          </Link>
          <form action={deleteCategory}>
            <input type="hidden" name="slug" value={category.slug} />
            <ConfirmButton
              message={`Delete the "${category.name}" collection? Its babies stay in the shop without a collection, and the page URL will stop working.`}
              className="rounded-full border border-rose-soft bg-white px-4 py-2 text-sm font-bold text-rose hover:bg-blush"
            >
              Delete
            </ConfirmButton>
          </form>
        </div>
      </div>
      <CategoryForm key={category.slug} category={category} />
    </>
  );
}
