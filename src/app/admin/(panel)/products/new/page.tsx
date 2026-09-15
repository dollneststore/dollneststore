import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminCategories } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <Link href="/admin/products" className="text-sm font-semibold text-lilac hover:underline">
        ← Products
      </Link>
      <PageHeader title="New product" />
      <Suspense fallback={<LoadingBlock />}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  const categories = await getAdminCategories();
  return <ProductForm categories={categories} />;
}
