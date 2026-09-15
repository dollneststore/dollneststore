import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/form-ui";
import { GuideForm } from "@/components/admin/guide-form";

export const metadata: Metadata = { title: "New guide" };

export default function NewGuidePage() {
  return (
    <>
      <Link href="/admin/guides" className="text-sm font-semibold text-lilac hover:underline">
        ← Guides
      </Link>
      <PageHeader title="New guide" />
      <GuideForm />
    </>
  );
}
