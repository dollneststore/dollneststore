-- SEO fields, static page SEO overrides and guides (blog)
-- Run after 20260915120000_initial_schema.sql

alter table public.products
  add column seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  add column seo_description text check (seo_description is null or char_length(seo_description) <= 170);

alter table public.categories
  add column intro text check (intro is null or char_length(intro) <= 5000),
  add column seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  add column seo_description text check (seo_description is null or char_length(seo_description) <= 170);

alter table public.site_settings
  add column google_site_verification text
    check (google_site_verification is null or google_site_verification ~ '^[A-Za-z0-9_-]{10,100}$');

-- ─── Static page SEO (empty values fall back to the defaults in code) ───────
create table public.page_seo (
  path text primary key check (path ~ '^/[a-z0-9/-]*$'),
  title text check (title is null or char_length(title) <= 70),
  description text check (description is null or char_length(description) <= 170),
  og_image_url text,
  updated_at timestamptz not null default now()
);
insert into public.page_seo (path) values
  ('/'), ('/reborn-dolls'), ('/guides'), ('/contact'), ('/delivery-returns'), ('/privacy'), ('/terms'), ('/cookies');

-- ─── Guides ──────────────────────────────────────────────────────────────────
create type public.post_status as enum ('draft', 'published');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 140),
  excerpt text check (excerpt is null or char_length(excerpt) <= 300),
  body text not null default '' check (char_length(body) <= 50000),
  cover_image_url text,
  cover_storage_path text,
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  status public.post_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_status_published_idx on public.posts (status, published_at desc);

create trigger page_seo_updated_at before update on public.page_seo for each row execute function public.set_updated_at();
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

-- ─── Grants & RLS ───────────────────────────────────────────────────────────
grant select on public.page_seo, public.posts to anon, authenticated;
grant insert, update on public.page_seo to authenticated;
grant insert, update, delete on public.posts to authenticated;

alter table public.page_seo enable row level security;
alter table public.posts enable row level security;

create policy "Anyone can read page SEO" on public.page_seo
  for select to anon, authenticated using (true);
create policy "Admins manage page SEO" on public.page_seo
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read published guides" on public.posts
  for select to anon, authenticated using ((status = 'published' and published_at <= now()) or (select public.is_admin()));
create policy "Admins manage guides" on public.posts
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ─── Starter guides (drafts: review and publish from /admin/guides) ─────────
insert into public.posts (slug, title, excerpt, body, status) values
(
  'how-to-care-for-a-silicone-reborn-doll',
  'How to care for a silicone reborn doll',
  'Simple, gentle habits that keep your silicone baby soft, clean and looking brand new for years.',
  $md$Full body silicone reborns are made to be cuddled — and with a little care they stay soft and lifelike for years. Here's how we look after the babies in our nursery.

## Keep them clean
- Wipe your baby with a soft, damp cloth and a drop of mild, fragrance-free soap.
- Pat dry with a lint-free towel. Silicone attracts fluff, so avoid fleecy blankets straight after cleaning.
- Our silicone babies don't have a wet system, so please don't submerge them in water.

## Keep the skin soft and matte
Silicone can feel slightly tacky over time. A very light dusting of cornstarch-free baby powder, brushed off with a soft make-up brush, helps bring back that silky newborn feel.

## Store them safely
- Keep your baby out of direct sunlight and away from radiators.
- Avoid dark or dyed fabrics resting on the skin for long periods, as colour can transfer.
- Keep pens, sharp jewellery and hair clips away from the silicone.

## Dressing your baby
Take your time and support the head, arms and legs as you would with a real newborn. Loose, soft outfits in natural fabrics are the kindest to silicone skin.

Have a question about your baby? [Message us](/contact) — we're always happy to help.$md$,
  'draft'
),
(
  'silicone-vs-cloth-body-reborn-dolls',
  'Silicone or cloth-body reborn: which is right for you?',
  'Weight, feel, age suitability and budget — a friendly comparison to help you choose your first reborn.',
  $md$Choosing your first reborn is exciting, and the biggest decision is usually the body type. Here's how our two most popular options compare.

## Full silicone reborn dolls
- **Feel:** soft, floppy and squishy all over, made from platinum silicone
- **Weight:** usually around 5–7 lbs, like a real newborn
- **Best for:** collectors and adults, or careful older children aged 8+
- **Price:** from around £200 in our shop

## Cloth-body reborn dolls
- **Feel:** a soft fabric body with vinyl head, arms and legs
- **Weight:** light (around 2 lbs) or weighted (around 5 lbs)
- **Best for:** a first reborn, gifts and gentle play for ages 3+
- **Price:** from around £45 in our shop

## Which should I choose?
If you want the most lifelike feel in your arms, a [silicone reborn](/reborn-dolls/silicone) is hard to beat. If you'd like something lighter, more affordable or for a younger child, a [cloth-body](/reborn-dolls/cloth-body) or [weighted](/reborn-dolls/weighted) baby is a lovely choice.

Still not sure? [Send us a message](/contact) and we'll help you find your little one.$md$,
  'draft'
);
