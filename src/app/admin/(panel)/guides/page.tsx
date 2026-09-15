import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { adminButton, LoadingBlock, PageHeader, StatusBadge } from "@/components/admin/form-ui";
import { getAdminGuides } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";
import { guidePath } from "@/lib/seo-defaults";

export const metadata: Metadata = { title: "Guides" };

export default function GuidesAdminPage() {
  return (
    <>
      <PageHeader
        title="Guides"
        description="Helpful articles bring visitors from Google. Aim for one new guide a month."
        action={
          <Link href="/admin/guides/new" className={adminButton}>
            New guide
          </Link>
        }
      />
      <Suspense fallback={<LoadingBlock />}>
        <GuideList />
      </Suspense>
    </>
  );
}

async function GuideList() {
  const guides = await getAdminGuides();
  if (!guides.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-lilac-line bg-white p-10 text-center text-sm text-muted">
        No guides yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[.08em] text-muted">
          <tr>
            <th className="p-4 font-bold">Guide</th>
            <th className="p-4 font-bold">Status</th>
            <th className="p-4 font-bold">Published</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {guides.map((g) => (
            <tr key={g.id} className="hover:bg-cream">
              <td className="p-4">
                <Link href={`/admin/guides/${g.id}`} className="font-bold hover:text-lilac">
                  {g.title}
                  <span className="block text-xs font-normal text-muted">{guidePath(g.slug)}</span>
                </Link>
              </td>
              <td className="p-4">
                <StatusBadge status={g.status} />
              </td>
              <td className="p-4 text-muted">{g.publishedAt ? formatDate(g.publishedAt) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
