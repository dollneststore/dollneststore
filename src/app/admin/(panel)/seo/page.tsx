import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCard, LoadingBlock, PageHeader } from "@/components/admin/form-ui";
import { PageSeoForm } from "@/components/admin/page-seo-form";
import { getAdminSeo } from "@/lib/admin/queries";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "SEO" };

export default function SeoPage() {
  return (
    <>
      <PageHeader
        title="SEO"
        description="Titles and descriptions for fixed pages. Products, collections and guides have their own SEO section on their edit page."
      />
      <div className="mb-6 max-w-3xl">
        <AdminCard title="Checklist">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#6b5a60]">
            <li>
              Submit <code className="rounded bg-cream px-1.5 py-0.5">{site.url}/sitemap.xml</code> in Google Search Console → Sitemaps.
            </li>
            <li>Keep titles under 60 characters and descriptions under 155 — the counters turn pink when Google may cut them off.</li>
            <li>Use keywords people search for (e.g. “silicone reborn doll”, “weighted reborn baby”) in product URLs and titles.</li>
            <li>Every product photo should have a short description (alt text) on the product page.</li>
            <li>Link reviews to products in Reviews → they show as stars in Google.</li>
          </ul>
        </AdminCard>
      </div>
      <Suspense fallback={<LoadingBlock />}>
        <SeoSettings />
      </Suspense>
    </>
  );
}

async function SeoSettings() {
  const { pages, googleSiteVerification } = await getAdminSeo();
  return <PageSeoForm pages={pages} googleSiteVerification={googleSiteVerification} />;
}
