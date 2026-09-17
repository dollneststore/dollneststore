-- Lets the shop owner choose the big photo at the top of the home page from /admin/settings,
-- instead of it always being the first featured baby. Safe to run more than once.

alter table public.site_settings
  add column if not exists hero_image_url text;
