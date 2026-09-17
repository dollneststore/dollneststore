-- Discount codes, the welcome pop-up and the /reviews page. Safe to run more than once.

-- ─── Discount codes ─────────────────────────────────────────────────────────
-- Visitors must never be able to list codes, so there is no public select policy:
-- a code is checked through check_discount_code() below, which returns one row or nothing.
create table if not exists public.discount_codes (
  code text primary key check (code ~ '^[A-Z0-9][A-Z0-9-]{2,23}$'),
  percent_off int not null check (percent_off between 1 and 90),
  is_active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses int check (max_uses is null or max_uses > 0),
  times_used int not null default 0 check (times_used >= 0),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists discount_codes_updated_at on public.discount_codes;
create trigger discount_codes_updated_at before update on public.discount_codes
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.discount_codes to authenticated;
alter table public.discount_codes enable row level security;

drop policy if exists "Admins manage discount codes" on public.discount_codes;
create policy "Admins manage discount codes" on public.discount_codes
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Checks one code and reveals nothing else. Runs as the owner so it can read the table
-- without a public select policy.
create or replace function public.check_discount_code(p_code text)
returns table (code text, percent_off int)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select d.code, d.percent_off
  from public.discount_codes d
  where d.code = upper(btrim(p_code))
    and d.is_active
    and (d.starts_at is null or d.starts_at <= now())
    and (d.expires_at is null or d.expires_at > now())
    and (d.max_uses is null or d.times_used < d.max_uses)
  limit 1;
$$;

revoke all on function public.check_discount_code(text) from public;
grant execute on function public.check_discount_code(text) to anon, authenticated;

-- ─── Welcome pop-up (managed from /admin/settings) ──────────────────────────
alter table public.site_settings
  add column if not exists popup_enabled boolean not null default false,
  add column if not exists popup_heading text check (popup_heading is null or char_length(popup_heading) <= 80),
  add column if not exists popup_body text check (popup_body is null or char_length(popup_body) <= 240),
  add column if not exists popup_code text check (popup_code is null or char_length(popup_code) <= 24);

-- ─── Starter 10% code, switched on once ─────────────────────────────────────
insert into public.discount_codes (code, percent_off, note)
values ('WELCOME10', 10, 'Welcome pop-up discount')
on conflict (code) do nothing;

update public.site_settings
set popup_enabled = true,
    popup_heading = '10% off your first baby ♡',
    popup_body = 'Use this code at checkout for 10% off your first order, and we''ll send you new babies before anyone else.',
    popup_code = 'WELCOME10'
where id = 1 and popup_code is null;

-- ─── SEO row for the new reviews page ───────────────────────────────────────
insert into public.page_seo (path) values ('/reviews') on conflict (path) do nothing;
