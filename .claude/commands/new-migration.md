---
description: Create a new Supabase migration with RLS
argument-hint: <short description of the change>
---

Create a new Supabase migration for: $ARGUMENTS

1. Read the existing files in `supabase/migrations/` to understand the current schema.
2. Create `supabase/migrations/<UTC timestamp YYYYMMDDHHMMSS>_<snake_case_description>.sql`.
3. For new tables include: primary key, constraints, indexes, `updated_at` trigger if mutable, explicit grants, `enable row level security` and policies following `.claude/rules/supabase.md`.
4. Update the TypeScript types/mappers in `src/lib/types.ts` and `src/lib/data/mappers.ts` if needed.
5. Tell me how to apply it (Supabase SQL editor or `supabase db push`).
