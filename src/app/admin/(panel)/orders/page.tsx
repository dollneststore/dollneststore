import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, LoadingBlock, PageHeader, StatusBadge } from "@/components/admin/form-ui";
import { getAdminOrders } from "@/lib/admin/queries";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatuses } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageHeader
        title="Orders"
        description="Track every order from payment to doorstep."
        action={
          <Link href="/admin/orders/new" className={adminButton}>
            Record order
          </Link>
        }
      />
      <Suspense fallback={<LoadingBlock />}>
        <OrdersTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrdersTable({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const { status } = await searchParams;
  const current = typeof status === "string" ? status : undefined;
  const orders = await getAdminOrders(current);

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${active ? "bg-lilac text-white" : "border border-line bg-white hover:border-lilac"}`;

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <Link href="/admin/orders" className={chip(!current)}>
          All
        </Link>
        {orderStatuses.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={chip(current === s)}>
            {s}
          </Link>
        ))}
      </nav>

      {orders.length ? (
        <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[.08em] text-muted">
              <tr>
                <th className="p-4 font-bold">Order</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Channel</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream">
                  <td className="p-4 font-bold">
                    <Link href={`/admin/orders/${o.id}`} className="text-lilac hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-4 text-muted">{formatDateTime(o.createdAt)}</td>
                  <td className="p-4">{o.customerName}</td>
                  <td className="p-4 capitalize">{o.channel}</td>
                  <td className="p-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-4 text-right font-bold">{formatPrice(o.totalPence)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[20px] border border-dashed border-lilac-line bg-white p-10 text-center text-sm text-muted">
          No orders {current ? `with status “${current}”` : "yet"}.
        </div>
      )}
    </div>
  );
}
