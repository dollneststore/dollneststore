# Security rules

- Treat every server action and route handler as a public endpoint. First line: `await requireAdmin()` (admin) or explicit input validation (public).
- Validate all input with zod. Validate `params`, `searchParams`, ids (uuid) and file paths before use.
- Authorisation is enforced twice: in the data access layer (`src/lib/auth.ts`) **and** by Postgres RLS. Never rely on `proxy.ts` alone.
- Use `supabase.auth.getClaims()` (verifies the JWT). Never trust `getSession()` on the server.
- The service client (`src/lib/supabase/service.ts`) bypasses RLS. Only use it for narrow, validated jobs (newsletter, Stripe webhooks). Never in admin CRUD — admin uses the user's session so RLS applies.
- Secrets live only in env vars without `NEXT_PUBLIC_`. Never log secrets, tokens or full customer records.
- Return minimal objects from server actions (`{ ok, message }`), never raw DB rows.
- Uploads go browser → Supabase Storage (bucket policies allow admins only); the server action re-validates the storage path pattern before saving.
- Keep security headers/CSP in `next.config.ts` up to date when adding third-party scripts (e.g. Stripe, analytics).
- Payments (Stripe): prices are always recomputed server-side from the database; order status only changes to `paid` from a verified webhook (`stripe.webhooks.constructEvent`).
