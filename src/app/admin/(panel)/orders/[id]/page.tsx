import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminCard, LoadingBlock, StatusBadge } from "@/components/admin/form-ui";
import { OrderUpdateForm } from "@/components/admin/order-forms";
import { getAdminOrder } from "@/lib/admin/queries";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

export default function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <>
      <Link href="/admin/orders" className="text-sm font-semibold text-lilac hover:underline">
        ← Orders
      </Link>
      <Suspense fallback={<LoadingBlock />}>
        <OrderDetail params={params} />
      </Suspense>
    </>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const address = [order.shippingLine1, order.shippingLine2, order.shippingCity, order.shippingCounty, order.shippingPostcode]
    .filter(Boolean)
    .join(", ");
  const phoneDigits = order.customerPhone?.replace(/\D/g, "").replace(/^0/, "44");

  return (
    <>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-4xl font-medium">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">
          {formatDateTime(order.createdAt)} · via <span className="capitalize">{order.channel}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title="Items">
            <ul className="divide-y divide-line-soft">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <span className="relative size-14 flex-none overflow-hidden rounded-xl bg-blush">
                    {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" /> : null}
                  </span>
                  <span className="flex-1">
                    {item.productId ? (
                      <Link href={`/admin/products/${item.productId}`} className="font-bold hover:text-lilac">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-bold">{item.title}</span>
                    )}
                    <span className="block text-xs text-muted">
                      {item.quantity} × {formatPrice(item.unitPricePence)}
                    </span>
                  </span>
                  <span className="font-bold">{formatPrice(item.unitPricePence * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatPrice(order.subtotalPence)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>{order.shippingPence ? formatPrice(order.shippingPence) : "Free"}</dd>
              </div>
              {order.discountPence ? (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd>−{formatPrice(order.discountPence)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd className="text-lilac">{formatPrice(order.totalPence)}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Customer & delivery">
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-bold">{order.customerName}</p>
                {order.customerEmail ? (
                  <a href={`mailto:${order.customerEmail}`} className="block text-lilac hover:underline">
                    {order.customerEmail}
                  </a>
                ) : null}
                {order.customerPhone ? (
                  <p>
                    {order.customerPhone}
                    {phoneDigits ? (
                      <>
                        {" · "}
                        <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-sage-deep hover:underline">
                          WhatsApp
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.08em] text-muted">Deliver to</p>
                <p className="mt-1">{address || "No address recorded"}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs text-muted">
              <div>
                <dt className="font-bold uppercase">Paid</dt>
                <dd>{order.paidAt ? formatDateTime(order.paidAt) : "—"}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase">Dispatched</dt>
                <dd>{order.dispatchedAt ? formatDateTime(order.dispatchedAt) : "—"}</dd>
              </div>
            </dl>
          </AdminCard>
        </div>

        <OrderUpdateForm key={order.id} order={order} />
      </div>
    </>
  );
}
