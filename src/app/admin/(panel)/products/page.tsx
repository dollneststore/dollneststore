import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, adminButtonSecondary, inputClass, LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { duplicateProduct, quickUpdateProduct } from "@/lib/admin/actions/products";
import { getAdminCategories, getAdminProducts } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";
import { productPath } from "@/lib/seo-defaults";
import { productStatuses } from "@/lib/types";

export const metadata: Metadata = { title: "Products" };

const statusLabels: Record<(typeof productStatuses)[number], string> = {
  draft: "Draft",
  active: "Active",
  sold_out: "Sold out",
  archived: "Archived",
};

const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader
        title="Products"
        description="Search, filter and update stock right from the list."
        action={
          <Link href="/admin/products/new" className={adminButton}>
            New product
          </Link>
        }
      />
      <Suspense fallback={<LoadingBlock />}>
        <ProductsTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductsTable({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const sp = await searchParams;
  const filters = { q: param(sp.q), status: param(sp.status), collection: param(sp.collection), stock: param(sp.stock) };
  const [products, categories] = await Promise.all([getAdminProducts(filters), getAdminCategories()]);
  const filtered = Object.values(filters).some(Boolean);
  const compactInput = `${inputClass} w-auto py-2`;

  return (
    <div className="flex flex-col gap-4">
      <Form action="/admin/products" className="flex flex-wrap items-center gap-2 rounded-[20px] border border-line bg-white p-3">
        <label className="min-w-[200px] flex-1">
          <span className="sr-only">Search products</span>
          <input name="q" type="search" defaultValue={filters.q} placeholder="Search by name or URL…" className={`${inputClass} py-2`} />
        </label>
        <select name="status" defaultValue={filters.status} aria-label="Status" className={compactInput}>
          <option value="">All statuses</option>
          {productStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <select name="collection" defaultValue={filters.collection} aria-label="Collection" className={compactInput}>
          <option value="">All collections</option>
          <option value="none">No collection</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="stock" defaultValue={filters.stock} aria-label="Stock" className={compactInput}>
          <option value="">Any stock</option>
          <option value="in">In stock</option>
          <option value="out">Out of stock</option>
        </select>
        <button type="submit" className={adminButtonSecondary}>
          Filter
        </button>
        {filtered ? (
          <Link href="/admin/products" className="px-2 text-sm font-semibold text-muted hover:text-rose">
            Clear
          </Link>
        ) : null}
      </Form>

      <p className="text-sm text-muted">
        {products.length} {products.length === 1 ? "baby" : "babies"}
        {filtered ? " match your filters" : ""}
      </p>

      {products.length ? (
        <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[.08em] text-muted">
              <tr>
                <th className="p-4 font-bold">Baby</th>
                <th className="p-4 font-bold">Price</th>
                <th className="p-4 font-bold">Stock & status</th>
                <th className="p-4 text-center font-bold">Featured</th>
                <th className="p-4 font-bold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-cream">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-bold hover:text-lilac">
                      <span className="relative size-12 flex-none overflow-hidden rounded-xl bg-blush">
                        {p.images[0] ? <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-cover" /> : null}
                      </span>
                      <span>
                        {p.title}
                        <span className="block text-xs font-normal text-muted">{productPath(p.slug)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-4 font-semibold whitespace-nowrap">{formatPrice(p.pricePence)}</td>
                  <td className="p-3">
                    {/* Keyed on the saved values so the inputs refresh after a quick update. */}
                    <form key={`${p.id}-${p.stockQty}-${p.status}`} action={quickUpdateProduct} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="stockQty"
                        type="number"
                        min={0}
                        max={999}
                        defaultValue={p.stockQty}
                        aria-label={`Stock for ${p.title}`}
                        className={`${inputClass} w-20 px-2 py-1.5 ${p.stockQty === 0 ? "font-bold text-rose" : ""}`}
                      />
                      <select name="status" defaultValue={p.status} aria-label={`Status for ${p.title}`} className={`${inputClass} w-auto py-1.5`}>
                        {productStatuses.map((s) => (
                          <option key={s} value={s}>
                            {statusLabels[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-lilac-soft px-3 py-1.5 text-xs font-bold text-lilac transition-colors hover:bg-lilac hover:text-white"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                  <td className="p-4 text-center text-star">{p.isFeatured ? "★" : ""}</td>
                  <td className="p-3">
                    <form action={duplicateProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs font-bold whitespace-nowrap text-lilac hover:underline">
                        Duplicate
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-lilac-line bg-white p-10 text-center text-sm text-muted">
          {filtered ? "No babies match these filters." : "No products yet. Create one, run pnpm db:seed or import from Etsy."}
        </div>
      )}
    </div>
  );
}
