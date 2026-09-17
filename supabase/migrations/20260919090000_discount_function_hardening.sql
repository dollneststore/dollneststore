-- Hardens check_discount_code the same way the other security-definer functions are hardened:
-- an empty search_path with fully qualified calls, so nothing can be shadowed.
-- Safe to run more than once.

create or replace function public.check_discount_code(p_code text)
returns table (code text, percent_off int)
language sql
security definer
set search_path = ''
stable
as $$
  select d.code, d.percent_off
  from public.discount_codes d
  where d.code = pg_catalog.upper(pg_catalog.btrim(p_code))
    and d.is_active
    and (d.starts_at is null or d.starts_at <= pg_catalog.now())
    and (d.expires_at is null or d.expires_at > pg_catalog.now())
    and (d.max_uses is null or d.times_used < d.max_uses)
  limit 1;
$$;

revoke all on function public.check_discount_code(text) from public;
grant execute on function public.check_discount_code(text) to anon, authenticated;
