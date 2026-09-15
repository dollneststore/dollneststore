import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { adminButtonSecondary, LoadingBlock } from "@/components/admin/form-ui";
import { ProductForm } from "@/components/admin/product-form";
import { deleteProduct } from "@/lib/admin/actions/products";
import { getAdminCategories, getAdminProduct } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  return (
    <>
      <Link href="/admin/products" className="text-sm font-semibold text-lilac hover:underline">
        ← Products
      </Link>
      <Suspense fallback={<LoadingBlock />}>
        <EditProduct params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([getAdminProduct(id), getAdminCategories()]);
  if (!product) notFound();

  return (
    <>
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-medium">{product.title}</h1>
          {query.created ? <p className="mt-1 text-sm font-semibold text-sage-deep">Product created ♡</p> : null}
        </div>
        <div className="flex gap-2">
          {product.status === "active" || product.status === "sold_out" ? (
            <Link href={`/reborn-dolls/${product.slug}`} target="_blank" className={adminButtonSecondary}>
              View on shop ↗
            </Link>
          ) : null}
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmButton
              message={`Delete "${product.title}" permanently? Past orders keep their details.`}
              className="rounded-full border border-rose-soft bg-white px-4 py-2 text-sm font-bold text-rose hover:bg-blush"
            >
              Delete
            </ConfirmButton>
          </form>
        </div>
      </div>
      <ProductForm key={product.id} product={product} categories={categories} />
    </>
  );
}
