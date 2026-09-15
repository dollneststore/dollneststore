import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { ReviewForm } from "@/components/admin/review-form";
import { deleteReview, setReviewPublished } from "@/lib/admin/actions/reviews";
import { getAdminReviews } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reviews" };

export default function ReviewsPage() {
  return (
    <>
      <PageHeader title="Reviews" description="Published reviews appear on the home page, newest first." />
      <div className="flex flex-col gap-6">
        <ReviewForm />
        <Suspense fallback={<LoadingBlock />}>
          <ReviewList />
        </Suspense>
      </div>
    </>
  );
}

async function ReviewList() {
  const reviews = await getAdminReviews();
  if (!reviews.length) {
    return <p className="text-sm text-muted">No reviews yet.</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {reviews.map((r) => (
        <li key={r.id} className={`flex flex-col gap-2 rounded-[20px] border bg-white p-5 ${r.isPublished ? "border-line" : "border-dashed border-lilac-line opacity-70"}`}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold">
              {r.authorName} <span className="font-normal text-star">{"★".repeat(r.rating)}</span>
            </span>
            <span className="text-xs text-muted capitalize">
              {r.source}
              {r.reviewedAt ? ` · ${formatDate(r.reviewedAt)}` : ""}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[#6b5a60]">{r.body}</p>
          <div className="mt-auto flex gap-4 pt-2 text-xs font-bold">
            <form action={setReviewPublished}>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="publish" value={String(!r.isPublished)} />
              <button type="submit" className="text-lilac hover:underline">
                {r.isPublished ? "Hide from website" : "Publish"}
              </button>
            </form>
            <form action={deleteReview}>
              <input type="hidden" name="id" value={r.id} />
              <ConfirmButton message="Delete this review?" className="text-rose hover:underline">
                Delete
              </ConfirmButton>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
