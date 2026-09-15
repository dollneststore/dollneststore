import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { adminButtonSecondary, LoadingBlock, StatusBadge } from "@/components/admin/form-ui";
import { GuideForm } from "@/components/admin/guide-form";
import { deleteGuide } from "@/lib/admin/actions/guides";
import { getAdminGuide } from "@/lib/admin/queries";
import { guidePath } from "@/lib/seo-defaults";

export const metadata: Metadata = { title: "Edit guide" };

export default function EditGuidePage({ params, searchParams }: PageProps<"/admin/guides/[id]">) {
  return (
    <>
      <Link href="/admin/guides" className="text-sm font-semibold text-lilac hover:underline">
        ← Guides
      </Link>
      <Suspense fallback={<LoadingBlock />}>
        <EditGuide params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function EditGuide({ params, searchParams }: PageProps<"/admin/guides/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const guide = await getAdminGuide(id);
  if (!guide) notFound();

  return (
    <>
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-4xl font-medium">{guide.title}</h1>
            <StatusBadge status={guide.status} />
          </div>
          {query.created ? <p className="mt-1 text-sm font-semibold text-sage-deep">Guide created ♡</p> : null}
        </div>
        <div className="flex gap-2">
          {guide.status === "published" ? (
            <Link href={guidePath(guide.slug)} target="_blank" className={adminButtonSecondary}>
              View guide ↗
            </Link>
          ) : null}
          <form action={deleteGuide}>
            <input type="hidden" name="id" value={guide.id} />
            <ConfirmButton
              message={`Delete "${guide.title}" permanently?`}
              className="rounded-full border border-rose-soft bg-white px-4 py-2 text-sm font-bold text-rose hover:bg-blush"
            >
              Delete
            </ConfirmButton>
          </form>
        </div>
      </div>
      <GuideForm key={guide.id} guide={guide} />
    </>
  );
}
