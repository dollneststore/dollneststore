"use client";

import { savePageSeo } from "@/lib/admin/actions/seo";
import { pageSeoDefaults } from "@/lib/content/page-seo";
import type { PageSeo } from "@/lib/types";
import { adminButton, AdminCard, Field, FormMessage, inputClass } from "./form-ui";
import { SeoFields } from "./seo-fields";
import { useFormAction } from "./use-form-action";

export function PageSeoForm({ pages, googleSiteVerification }: { pages: Record<string, PageSeo>; googleSiteVerification: string | null }) {
  const { state, pending, onSubmit } = useFormAction(savePageSeo);
  const errors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <AdminCard title="Google Search Console">
        <Field
          label="Verification code"
          htmlFor="googleVerification"
          error={errors.googleVerification}
          hint="Search Console → Add property → URL prefix → HTML tag. Paste the whole <meta> tag or just the code."
        >
          <input
            id="googleVerification"
            name="googleVerification"
            defaultValue={googleSiteVerification ?? ""}
            placeholder='<meta name="google-site-verification" content="…" />'
            className={inputClass}
          />
        </Field>
      </AdminCard>

      {Object.entries(pageSeoDefaults).map(([path, defaults]) => (
        <AdminCard key={path} title={`${defaults.label} · ${path}`}>
          <SeoFields
            path={path}
            idPrefix={`page${path.replace(/\//g, "-") || "-home"}`}
            titleName={`title:${path}`}
            descriptionName={`description:${path}`}
            defaultTitle={defaults.title}
            defaultDescription={defaults.description}
            title={pages[path]?.title}
            description={pages[path]?.description}
            errors={errors}
          />
        </AdminCard>
      ))}

      <div className="sticky bottom-4 flex flex-col gap-3 rounded-[20px] border border-line bg-white/95 p-4 backdrop-blur">
        <FormMessage state={state} />
        <button type="submit" disabled={pending} className={`${adminButton} w-fit`}>
          {pending ? "Saving…" : "Save SEO"}
        </button>
      </div>
    </form>
  );
}
