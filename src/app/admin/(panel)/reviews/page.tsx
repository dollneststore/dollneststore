import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { ReviewForm } from "@/components/admin/review-form";
import { PhotoField } from "@/components/admin/photo-field";
import { deleteReview, setReviewPhoto, setReviewPublished } from "@/lib/admin/actions/reviews";
import { getAdminReviews, getReviewProductOptions } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reviews" };

export default function ReviewsPage() {
  return (
    <>
      <PageHeader title="Reviews" description="Published reviews appear on the home page and on linked product pages." />
      <Suspense fallback={<LoadingBlock />}>
        <Reviews />
      </Suspense>
    </>
  );
}

async function Reviews() {
  const [reviews, products] = await Promise.all([getAdminReviews(), getReviewProductOptions()]);

  return (
    <div className="flex flex-col gap-6">
      <ReviewForm products={products} />
      {reviews.length ? (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {reviews.map((r) => (
            <li
              key={r.id}
              className={`flex gap-4 rounded-[20px] border bg-white p-5 ${r.isPublished ? "border-line" : "border-dashed border-lilac-line opacity-70"}`}
            >
              {r.imageUrl ? (
                <span className="relative size-20 flex-none overflow-hidden rounded-xl bg-blush">
                  <Image src={r.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                </span>
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
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
                <details className="pt-1">
                  <summary className="cursor-pointer text-xs font-bold text-lilac">
                    {r.imageUrl ? "Replace photo" : "Add a photo"}
                  </summary>
                  <form action={setReviewPhoto} className="mt-2 flex flex-col gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    {/* The field name stays "imageUrl" (that's what the action reads); only the id is unique. */}
                    <PhotoField id={`photo-${r.id}`} defaultValue={r.imageUrl ?? ""} uploadLabel="Upload the customer's photo" />
                    <button type="submit" className="w-fit text-xs font-bold text-lilac hover:underline">
                      Save photo
                    </button>
                  </form>
                </details>
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
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No reviews yet.</p>
      )}
    </div>
  );
}
