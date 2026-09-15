---
description: Review the current changes for bugs, security and project conventions
---

Review the uncommitted changes (`git diff` and untracked files) in this repository.

Check, in order:
1. Correctness bugs and missing edge cases.
2. Security: every server action calls `requireAdmin()` or validates public input with zod; no secrets or service client leaking; RLS policies for any new table.
3. Cache Components: runtime data (cookies, params, searchParams) inside `<Suspense>`; public reads use `"use cache"` + `cacheTag`; mutations call `updateTag`.
4. Conventions in `.claude/rules/` (pence, UK English, accessibility, next/image).

Then run `pnpm typecheck && pnpm lint && pnpm build` and report the results. List findings most severe first with file:line references.
