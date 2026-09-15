@AGENTS.md

# Dollnest — dollneststore.co.uk

UK online shop for reborn baby dolls, run by HOYD. Trading Ltd (Bristol). Storefront + admin panel
(orders, products, reviews, settings). Stripe checkout is the next phase.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, `cacheComponents: true`
- Supabase (Postgres + Auth + Storage) via `@supabase/ssr`, RLS on every table
- Vercel (region `lhr1`), deployed automatically on push to `main`
- pnpm, zod v4

## Commands

- `pnpm dev` — local dev server
- `pnpm typecheck` / `pnpm lint` / `pnpm build` — run all three before committing
- `pnpm db:seed` — load the starter catalogue into Supabase
- `pnpm import:etsy [--update] [--copy-images] [--dry-run]` — import listings + reviews from Etsy API v3

## Layout

- `src/app/(shop)` — public storefront (home, /reborn-dolls, /reborn-dolls/[slug] = collection or product, /guides, basket, checkout, legal pages)
- `src/lib/seo.ts`, `src/lib/seo-defaults.ts`, `src/lib/content/` — metadata builders and default SEO copy (see `.claude/rules/seo.md`)
- `src/app/admin` — admin panel; `admin/login` is public, `admin/(panel)` requires an admin
- `src/lib/data/catalog.ts` — cached public reads (`"use cache"` + `cacheTag`)
- `src/lib/admin/` — server-only admin queries and server actions (each re-checks `requireAdmin()`)
- `src/lib/auth.ts` — data access layer for auth (`getAdmin`, `requireAdmin`)
- `src/proxy.ts` — refreshes Supabase session for `/admin/*` (optimistic check only)
- `supabase/migrations/` — schema, RLS policies, storage bucket. Never edit an applied migration; add a new one.
- `scripts/` — seed and Etsy import (use the secret key, run locally only)

## Conventions

Detailed rules live in `.claude/rules/`. The essentials:

- Money is integer pence everywhere; format with `formatPrice()` (en-GB, GBP).
- Public data: add to `catalog.ts` with `"use cache"`, `cacheLife`, `cacheTag`. After an admin mutation call `updateTag(tag)`.
- Anything reading cookies/searchParams/params must sit inside `<Suspense>` (Cache Components).
- Server actions: validate with zod, call `requireAdmin()` first, return minimal state, never raw rows.
- Never import `src/lib/supabase/service.ts` outside narrow server tasks; never expose `SUPABASE_SECRET_KEY`.
- UK English copy, UK consumer law (14-day cancellation, Consumer Rights Act 2015), UK GDPR.
