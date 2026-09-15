import type { Metadata } from "next";
import Link from "next/link";
import { CategoryForm } from "@/components/admin/category-form";
import { PageHeader } from "@/components/admin/form-ui";

export const metadata: Metadata = { title: "New collection" };

export default function NewCategoryPage() {
  return (
    <>
      <Link href="/admin/categories" className="text-sm font-semibold text-lilac hover:underline">
        ← Collections
      </Link>
      <PageHeader title="New collection" />
      <CategoryForm />
    </>
  );
}
