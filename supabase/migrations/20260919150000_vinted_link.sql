-- The shop's Vinted profile moved to its numbered address. Safe to run more than once.
-- Settings are cached, so after running this the site needs a new deployment (or any save in
-- /admin/settings, which refreshes the cache by itself).

update public.site_settings
set socials = jsonb_set(coalesce(socials, '{}'::jsonb), '{vinted}', '"https://www.vinted.co.uk/member/294261048-dollnest"')
where id = 1;
