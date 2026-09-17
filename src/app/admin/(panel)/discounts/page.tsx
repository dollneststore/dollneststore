import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { DiscountForm } from "@/components/admin/discount-form";
import { LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { deleteDiscountCode, setDiscountActive } from "@/lib/admin/actions/discounts";
import { getDiscountCodes } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Discounts" };

export default function DiscountsPage() {
  return (
    <>
      <PageHeader
        title="Discounts"
        description="Codes customers can enter in their basket. The welcome pop-up gives away the code you choose in Settings."
      />
      <Suspense fallback={<LoadingBlock />}>
        <Discounts />
      </Suspense>
    </>
  );
}

async function Discounts() {
  const codes = await getDiscountCodes();

  return (
    <div className="flex flex-col gap-6">
      <DiscountForm />
      {codes.length ? (
        <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[.08em] text-muted">
              <tr>
                <th className="p-4 font-bold">Code</th>
                <th className="p-4 font-bold">Discount</th>
                <th className="p-4 font-bold">Dates</th>
                <th className="p-4 font-bold">Used</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {codes.map((c) => (
                <tr key={c.code} className={c.isActive ? "hover:bg-cream" : "text-muted hover:bg-cream"}>
                  <td className="p-4 font-bold tracking-[1px]">
                    {c.code}
                    {c.note ? <span className="block text-xs font-normal text-muted">{c.note}</span> : null}
                  </td>
                  <td className="p-4">{c.percentOff}%</td>
                  <td className="p-4 text-xs">
                    {c.startsAt ? `From ${formatDate(c.startsAt)}` : "Any time"}
                    {c.expiresAt ? ` · until ${formatDate(c.expiresAt)}` : ""}
                  </td>
                  <td className="p-4 text-xs">
                    {c.timesUsed}
                    {c.maxUses ? ` of ${c.maxUses}` : ""}
                  </td>
                  <td className="p-4 text-xs font-bold">
                    {c.isActive ? <span className="text-sage-deep">On</span> : <span className="text-rose">Off</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-4 text-xs font-bold">
                      <form action={setDiscountActive}>
                        <input type="hidden" name="code" value={c.code} />
                        <input type="hidden" name="active" value={String(!c.isActive)} />
                        <button type="submit" className="text-lilac hover:underline">
                          {c.isActive ? "Switch off" : "Switch on"}
                        </button>
                      </form>
                      <form action={deleteDiscountCode}>
                        <input type="hidden" name="code" value={c.code} />
                        <ConfirmButton message="Delete this discount code?" className="text-rose hover:underline">
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">No discount codes yet.</p>
      )}
    </div>
  );
}
