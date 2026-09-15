import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, adminButtonSecondary, AdminCard, LoadingBlock, PageHeader, StatusBadge } from "@/components/admin/form-ui";
import { getDashboardStats } from "@/lib/admin/queries";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Today at the nest ♡"
        action={
          <div className="flex gap-2">
            <Link href="/admin/orders/new" className={adminButtonSecondary}>
              Record order
            </Link>
            <Link href="/admin/products/new" className={adminButton}>
              New product
            </Link>
          </div>
        }
      />
      <Suspense fallback={<LoadingBlock />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const stats = await getDashboardStats();
  const tiles = [
    { label: "Open orders", value: String(stats.openOrders), href: "/admin/orders?status=paid" },
    { label: "Revenue · 30 days", value: formatPrice(stats.revenue30dPence), href: "/admin/orders" },
    { label: "Orders · 30 days", value: String(stats.orders30d), href: "/admin/orders" },
    { label: "Babies for sale", value: String(stats.activeProducts), href: "/admin/products" },
    { label: "Newsletter", value: String(stats.subscribers), href: "/admin/settings" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="rounded-[20px] border border-line bg-white p-5 transition-colors hover:border-lilac">
            <p className="text-xs font-bold uppercase tracking-[.1em] text-muted">{tile.label}</p>
            <p className="mt-2 text-3xl font-bold text-lilac">{tile.value}</p>
          </Link>
        ))}
      </div>

      <AdminCard title="Latest orders">
        {stats.recentOrders.length ? (
          <ul className="divide-y divide-line-soft">
            {stats.recentOrders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:text-lilac">
                  <span className="font-bold">{order.orderNumber}</span>
                  <span className="flex-1 truncate text-sm">{order.customerName}</span>
                  <span className="text-xs text-muted">{formatDateTime(order.createdAt)}</span>
                  <StatusBadge status={order.status} />
                  <span className="w-20 text-right font-bold">{formatPrice(order.totalPence)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            No orders yet. Orders from the website will appear here once Stripe checkout is live — for now, use “Record order” for WhatsApp or marketplace sales.
          </p>
        )}
      </AdminCard>
    </div>
  );
}
