-- Accessories collection (care powder and future extras). Safe to run more than once.

insert into public.categories (slug, name, description, tint, sort_order)
values ('accessories', 'Accessories', 'Care & extras', 'peach', 5)
on conflict (slug) do nothing;

-- Move the doll care powder out of the silicone babies collection.
update public.products
set category_slug = 'accessories', gender = 'unisex', length_in = null, weight_lbs = null
where slug like 'silicone-doll-care-powder%' or lower(title) like '%care powder%';
