import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { site } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="bg-nest flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-[28px] border border-line bg-white p-8 shadow-[0_20px_60px_rgba(143,107,177,.12)]">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Image src={site.logo} alt="" width={56} height={56} className="size-14 rounded-full border-2 border-rose-soft object-cover" />
          <h1 className="font-serif text-3xl font-medium">Dollnest admin</h1>
          <p className="text-sm text-muted">Sign in to manage orders and babies.</p>
        </div>
        {configured ? (
          <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-cream" />}>
            <LoginForm />
          </Suspense>
        ) : (
          <p className="rounded-xl bg-peach px-4 py-3 text-sm break-words text-peach-deep [&_code]:break-all">
            Supabase isn&apos;t connected yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to the environment variables, then redeploy.
          </p>
        )}
      </div>
    </main>
  );
}
