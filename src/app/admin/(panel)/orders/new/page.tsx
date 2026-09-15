import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { ManualOrderForm } from "@/components/admin/order-forms";
import { getProductOptions } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Record order" };

export default function NewOrderPage() {
  return (
    <>
      <Link href="/admin/orders" className="text-sm font-semibold text-lilac hover:underline">
        ← Orders
      </Link>
      <PageHeader title="Record an order" description="For sales made on WhatsApp, TikTok, Etsy, Vinted or eBay." />
      <Suspense fallback={<LoadingBlock />}>
        <NewOrder />
      </Suspense>
    </>
  );
}

async function NewOrder() {
  const products = await getProductOptions();
  return <ManualOrderForm products={products} />;
}
