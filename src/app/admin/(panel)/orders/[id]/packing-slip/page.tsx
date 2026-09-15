import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/admin/form-ui";
import { PrintButton } from "@/components/admin/print-button";
import { getAdminOrder } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";
import { addressLine, companyLine, site } from "@/lib/site";

export const metadata: Metadata = { title: "Packing slip" };

export default function PackingSlipPage({ params }: PageProps<"/admin/orders/[id]/packing-slip">) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <PackingSlip params={params} />
    </Suspense>
  );
}

async function PackingSlip({ params }: Pick<PageProps<"/admin/orders/[id]/packing-slip">, "params">) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const addressLines = [
    order.customerName,
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingCity, order.shippingCounty].filter(Boolean).join(", "),
    order.shippingPostcode,
    order.shippingCountry === "GB" ? "United Kingdom" : order.shippingCountry,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-lilac hover:underline">
          ← {order.orderNumber}
        </Link>
        <PrintButton label="Print packing slip" />
      </div>

      <article className="rounded-[20px] border border-line bg-white p-8 text-cocoa print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-6 border-b border-dashed border-lilac-line pb-6">
          <div className="flex items-center gap-3">
            <Image src={site.logo} alt="" width={52} height={52} className="size-13 rounded-full border-2 border-rose-soft object-cover" />
            <div>
              <p className="font-serif text-3xl font-semibold text-lilac">Dollnest</p>
              <p className="text-xs text-muted">{site.tagline}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Packing slip</p>
            <p className="mt-1 text-lg font-bold">{order.orderNumber}</p>
            <p className="text-muted">{formatDate(order.createdAt)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Deliver to</p>
            <address className="mt-2 leading-relaxed not-italic">
              {addressLines.map((line, index) => (
                <span key={index} className={`block ${index === 0 ? "font-bold" : ""}`}>
                  {line}
                </span>
              ))}
            </address>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">From</p>
            <p className="mt-2 leading-relaxed">
              <span className="block font-bold">Dollnest</span>
              {site.company.legalName}
              <br />
              {addressLine}
            </p>
          </div>
        </section>

        <table className="w-full text-left text-sm">
          <thead className="border-y border-line text-xs uppercase tracking-[.1em] text-muted">
            <tr>
              <th className="py-2 font-bold">Item</th>
              <th className="py-2 text-right font-bold">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3">{item.title}</td>
                <td className="py-3 text-right font-bold">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-8 rounded-2xl bg-blush p-5 text-sm leading-relaxed print:bg-transparent print:p-0">
          <p className="font-serif text-2xl">Thank you for giving your little one a loving home ♡</p>
          <p className="mt-2 text-[#6b5a60]">
            Questions about your baby? Message us on WhatsApp {site.whatsapp.display} or email {site.email}. You can return an
            item within 14 days of delivery — see dollneststore.co.uk/delivery-returns.
          </p>
        </section>

        <footer className="mt-8 border-t border-line pt-4 text-center text-[11px] text-muted">
          {companyLine} · {addressLine}
        </footer>
      </article>
    </div>
  );
}
