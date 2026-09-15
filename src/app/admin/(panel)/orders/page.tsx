import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, adminButtonSecondary, inputClass, LoadingBlock, PageHeader, StatusBadge } from "@/components/admin/form-ui";
import { getAdminOrders } from "@/lib/admin/queries";
import { formatDateTime, formatPrice } from "@/lib/format";
import { orderStatuses } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };

const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

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
  const sp = await searchParams;
  const status = param(sp.status);
  const q = param(sp.q);
  const orders = await getAdminOrders({ status, q });

  const href = (nextStatus?: string) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (q) params.set("q", q);
    const query = params.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  };
  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${active ? "bg-lilac text-white" : "border border-line bg-white hover:border-lilac"}`;

  return (
    <div className="flex flex-col gap-4">
      <Form action="/admin/orders" className="flex flex-wrap items-center gap-2 rounded-[20px] border border-line bg-white p-3">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Search orders</span>
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Order number, customer, email, phone or postcode…"
            className={`${inputClass} py-2`}
          />
        </label>
        <button type="submit" className={adminButtonSecondary}>
          Search
        </button>
        {q ? (
          <Link href={href(status)} className="px-2 text-sm font-semibold text-muted hover:text-rose">
            Clear
          </Link>
        ) : null}
      </Form>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        <Link href={href()} className={chip(!status)}>
          All
        </Link>
        {orderStatuses.map((s) => (
          <Link key={s} href={href(s)} className={chip(status === s)}>
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
          No orders {q ? `matching “${q}”` : status ? `with status “${status}”` : "yet"}.
        </div>
      )}
    </div>
  );
}
