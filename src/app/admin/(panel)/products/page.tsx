import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, LoadingBlock, PageHeader, StatusBadge } from "@/components/admin/form-ui";
import { getAdminProducts } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the nursery. Click a baby to edit."
        action={
          <Link href="/admin/products/new" className={adminButton}>
            New product
          </Link>
        }
      />
      <Suspense fallback={<LoadingBlock />}>
        <ProductsTable />
      </Suspense>
    </>
  );
}

async function ProductsTable() {
  const products = await getAdminProducts();

  if (!products.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-lilac-line bg-white p-10 text-center text-sm text-muted">
        No products yet. Create one, run <code>pnpm db:seed</code> or <code>pnpm import:etsy</code>.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[.08em] text-muted">
          <tr>
            <th className="p-4 font-bold">Baby</th>
            <th className="p-4 font-bold">Price</th>
            <th className="p-4 font-bold">Stock</th>
            <th className="p-4 font-bold">Status</th>
            <th className="p-4 font-bold">Featured</th>
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
                    <span className="block text-xs font-normal text-muted">/reborn-dolls/{p.slug}</span>
                  </span>
                </Link>
              </td>
              <td className="p-4 font-semibold">{formatPrice(p.pricePence)}</td>
              <td className={`p-4 font-semibold ${p.stockQty === 0 ? "text-rose" : ""}`}>{p.stockQty}</td>
              <td className="p-4">
                <StatusBadge status={p.status} />
              </td>
              <td className="p-4">{p.isFeatured ? "★" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
