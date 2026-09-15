-- Dollnest — initial schema
-- Money is stored in pence (integer). All tables have RLS enabled.
-- Public visitors can only read published catalogue data; everything else is admin-only.

create extension if not exists pgcrypto;

-- ─── Types ───────────────────────────────────────────────────────────────────
create type public.product_status as enum ('draft', 'active', 'sold_out', 'archived');
create type public.product_gender as enum ('girl', 'boy', 'unisex');
create type public.order_status as enum ('pending', 'paid', 'processing', 'dispatched', 'delivered', 'cancelled', 'refunded');
create type public.order_channel as enum ('website', 'whatsapp', 'etsy', 'vinted', 'ebay', 'tiktok', 'other');
create type public.review_source as enum ('website', 'etsy', 'vinted', 'ebay', 'tiktok');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Admins ──────────────────────────────────────────────────────────────────
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ─── Catalogue ───────────────────────────────────────────────────────────────
create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  image_url text,
  tint text not null default 'rose' check (tint in ('rose', 'lilac', 'peach', 'sage', 'sky')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 140),
  description text not null default '',
  price_pence int not null check (price_pence >= 0),
  compare_at_price_pence int check (compare_at_price_pence is null or compare_at_price_pence >= 0),
  category_slug text references public.categories (slug) on update cascade on delete set null,
  gender public.product_gender not null default 'unisex',
  length_in numeric(4, 1),
  weight_lbs numeric(4, 1),
  stock_qty int not null default 1 check (stock_qty >= 0),
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  badge text check (badge is null or char_length(badge) <= 40),
  sort_order int not null default 0,
  etsy_listing_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_sort_idx on public.products (status, sort_order);
create index products_category_idx on public.products (category_slug);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(author_name) between 1 and 80),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 2000),
  source public.review_source not null default 'website',
  image_url text,
  product_id uuid references public.products (id) on delete set null,
  is_published boolean not null default true,
  reviewed_at date,
  external_id text unique,
  created_at timestamptz not null default now()
);
create index reviews_published_idx on public.reviews (is_published, reviewed_at desc);

-- ─── Orders ──────────────────────────────────────────────────────────────────
create sequence public.order_number_seq start 10001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('DN-' || nextval('public.order_number_seq')),
  status public.order_status not null default 'pending',
  channel public.order_channel not null default 'website',
  customer_name text not null,
  customer_email text,
  customer_phone text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_city text,
  shipping_county text,
  shipping_postcode text,
  shipping_country text not null default 'GB',
  subtotal_pence int not null default 0 check (subtotal_pence >= 0),
  shipping_pence int not null default 0 check (shipping_pence >= 0),
  discount_pence int not null default 0 check (discount_pence >= 0),
  total_pence int not null default 0 check (total_pence >= 0),
  currency text not null default 'gbp',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  carrier text,
  tracking_number text,
  notes text,
  paid_at timestamptz,
  dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_matches check (total_pence = subtotal_pence + shipping_pence - discount_pence)
);
create index orders_status_created_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  unit_price_pence int not null check (unit_price_pence >= 0),
  quantity int not null check (quantity > 0),
  image_url text
);
create index order_items_order_idx on public.order_items (order_id);

-- ─── Site settings & newsletter ─────────────────────────────────────────────
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  announcement text check (announcement is null or char_length(announcement) <= 160),
  socials jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- ─── updated_at triggers ────────────────────────────────────────────────────
create trigger categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

-- ─── Grants (RLS below still decides row access) ────────────────────────────
grant select on public.categories, public.products, public.product_images, public.reviews, public.site_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images, public.reviews to authenticated;
grant update on public.site_settings to authenticated;
grant select, insert, update, delete on public.orders, public.order_items to authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;
grant select on public.admins to authenticated;
grant usage on sequence public.order_number_seq to authenticated;

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.newsletter_subscribers enable row level security;

create policy "Users can see their own admin row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Anyone can read categories" on public.categories
  for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read listed products" on public.products
  for select to anon, authenticated using (status in ('active', 'sold_out') or (select public.is_admin()));
create policy "Admins manage products" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read images of listed products" on public.product_images
  for select to anon, authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.status in ('active', 'sold_out') or (select public.is_admin()))
    )
  );
create policy "Admins manage product images" on public.product_images
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read published reviews" on public.reviews
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "Admins manage reviews" on public.reviews
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins manage orders" on public.orders
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage order items" on public.order_items
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Anyone can read site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "Admins update site settings" on public.site_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Admins read newsletter subscribers" on public.newsletter_subscribers
  for select to authenticated using ((select public.is_admin()));
create policy "Admins delete newsletter subscribers" on public.newsletter_subscribers
  for delete to authenticated using ((select public.is_admin()));

-- ─── Storage: product images ────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "Admins read product image objects" on storage.objects
  for select to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));

-- ─── Starter categories ─────────────────────────────────────────────────────
insert into public.categories (slug, name, description, image_url, tint, sort_order) values
  ('silicone', 'Silicone babies', 'Floppy & squishy', 'https://i.etsystatic.com/64552494/r/il/5d8709/7901487361/il_794xN.7901487361_9phl.jpg', 'rose', 1),
  ('cloth-body', 'Cloth-body', 'Soft body, vinyl limbs', 'https://i.etsystatic.com/64552494/r/il/bbf807/8510061144/il_794xN.8510061144_aebd.jpg', 'lilac', 2),
  ('mini', 'Mini reborns', '12 inch', 'https://i.etsystatic.com/64552494/r/il/f39bcc/8302450043/il_794xN.8302450043_opx8.jpg', 'peach', 3),
  ('weighted', 'Weighted', 'Approx. 5 lbs', 'https://i.etsystatic.com/64552494/r/il/e54c15/8510092476/il_794xN.8510092476_bdqo.jpg', 'sage', 4);
