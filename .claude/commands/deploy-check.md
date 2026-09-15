---
description: Pre-deploy checklist before pushing to main (Vercel auto-deploys)
---

Before pushing to `main`:

1. Run `pnpm typecheck`, `pnpm lint` and `pnpm build`; stop and report if any fail.
2. Check `git status` for accidentally staged files (`.env*`, `data/`, large images).
3. If `supabase/migrations/` changed, remind me to apply the migration to the production Supabase project **before** the deploy goes live.
4. If new env vars were introduced, list them so I can add them in Vercel → Settings → Environment Variables.
5. Summarise what will change for customers.

Do not push without my confirmation.
