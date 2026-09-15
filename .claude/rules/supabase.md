# Supabase & data rules

- Schema changes: create a new file in `supabase/migrations/` named `YYYYMMDDHHMMSS_description.sql`. Never edit an applied migration.
- Every new table: `enable row level security`, explicit grants, and policies. Public read policies must filter to published rows; writes use `(select public.is_admin())`.
- Money columns are `int` pence with `check (>= 0)`.
- Public storefront reads go through `src/lib/data/catalog.ts` using the cookie-less public client inside `"use cache"` with a `cacheTag`.
- Admin reads/writes go through `src/lib/admin/` using the request client (`src/lib/supabase/server.ts`) so RLS applies.
- After a mutation that affects public data call `updateTag("products" | "categories" | "reviews" | "settings")`.
- Keys: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser-safe) and `SUPABASE_SECRET_KEY` (server/scripts only).
