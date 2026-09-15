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
  const { todo } = stats;

  const tiles: { label: string; value: string; href?: string }[] = [
    { label: "Open orders", value: String(stats.openOrders), href: "/admin/orders" },
    { label: "Paid · last 30 days", value: formatPrice(stats.revenue30dPence), href: "/admin/orders" },
    { label: "Paid orders · 30 days", value: String(stats.orders30d), href: "/admin/orders" },
    { label: "Babies in stock", value: String(stats.activeProducts), href: "/admin/products?status=active&stock=in" },
    { label: "Newsletter subscribers", value: String(stats.subscribers) },
  ];

  const tasks = [
    { count: todo.toDispatchCount, label: "paid orders to pack and dispatch", href: "/admin/orders?status=paid", tone: "bg-sky text-sky-deep" },
    { count: todo.awaitingPayment, label: "orders awaiting payment", href: "/admin/orders?status=pending", tone: "bg-peach text-peach-deep" },
    { count: todo.activeOutOfStock, label: "babies marked active but with 0 stock", href: "/admin/products?status=active&stock=out", tone: "bg-blush text-rose" },
    { count: todo.draftProducts, label: "draft products not on the shop yet", href: "/admin/products?status=draft", tone: "bg-lilac-soft text-lilac" },
    { count: todo.draftGuides, label: "draft guides waiting to be published", href: "/admin/guides", tone: "bg-lilac-soft text-lilac" },
    { count: todo.unlinkedReviews, label: "reviews not linked to a baby (no Google stars)", href: "/admin/reviews", tone: "bg-sage text-sage-deep" },
  ].filter((task) => task.count > 0);

  const tileClass = "rounded-[20px] border border-line bg-white p-5";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => {
          const content = (
            <>
              <p className="text-xs font-bold uppercase tracking-[.1em] text-muted">{tile.label}</p>
              <p className="mt-2 text-3xl font-bold text-lilac">{tile.value}</p>
            </>
          );
          return tile.href ? (
            <Link key={tile.label} href={tile.href} className={`${tileClass} transition-colors hover:border-lilac`}>
              {content}
            </Link>
          ) : (
            <div key={tile.label} className={tileClass}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <AdminCard title="Needs your attention">
          {tasks.length ? (
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <li key={task.label}>
                  <Link href={task.href} className="flex items-center gap-3 rounded-2xl border border-line-soft p-3 transition-colors hover:border-lilac">
                    <span className={`grid min-w-9 place-items-center rounded-full px-2 py-1 text-sm font-bold ${task.tone}`}>{task.count}</span>
                    <span className="flex-1 text-sm">{task.label}</span>
                    <span className="text-lilac" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">All caught up ♡ Nothing needs doing right now.</p>
          )}

          {todo.toDispatch.length ? (
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-muted">Dispatch next (oldest first)</p>
              <ul className="divide-y divide-line-soft">
                {todo.toDispatch.map((order) => (
                  <li key={order.id}>
                    <Link href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-lilac">
                      <span className="font-bold">{order.orderNumber}</span>
                      <span className="flex-1 truncate">{order.customerName}</span>
                      <span className="text-xs text-muted">{formatDateTime(order.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </AdminCard>

        <AdminCard title="Latest orders">
          {stats.recentOrders.length ? (
            <ul className="divide-y divide-line-soft">
              {stats.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:text-lilac">
                    <span className="font-bold">{order.orderNumber}</span>
                    <span className="flex-1 truncate text-sm">{order.customerName}</span>
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
    </div>
  );
}
