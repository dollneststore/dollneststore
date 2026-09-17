-- Sets the big photo at the top of the home page to the one the shop owner sent
-- (a baby the shop no longer has in stock, chosen for the photo style).
-- The file ships with the site at /photos/, so it is served from our own domain.
-- Safe to run more than once. To change it later: /admin/settings → Home page photo.

update public.site_settings
set hero_image_url = '/photos/reborn-baby-girl-pink-bow-teddy-bear.jpg'
where id = 1;
