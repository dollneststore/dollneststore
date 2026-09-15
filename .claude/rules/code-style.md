# Code style

- TypeScript strict. No `any`; map DB rows (snake_case) to app types (camelCase) in `src/lib/data/mappers.ts`.
- Server Components by default. Add `"use client"` only for interactivity, and keep client components small.
- Styling: Tailwind v4 utilities with the design tokens in `src/app/globals.css` (`text-cocoa`, `bg-blush`, `text-lilac`…). Reusable class strings live in `src/components/ui/styles.ts`.
- Fonts: `font-serif` (Cormorant Garamond) for headings, `font-sans` (Manrope) for UI.
- Accessibility: semantic landmarks, labelled inputs, `aria-current` for active links, visible focus, alt text for product photos.
- Images: always `next/image` with `sizes`. Remote hosts must be allowed in `next.config.ts` → `images.remotePatterns` and CSP `img-src`.
- Copy is UK English ("basket", "delivery", "colour", "£").
- Read the version-matched Next.js docs in `node_modules/next/dist/docs/` before using an unfamiliar API.
