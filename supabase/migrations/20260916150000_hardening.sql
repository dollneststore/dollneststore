-- Hardening: rate limiting, transactional orders & stock, stricter storage, newsletter re-subscribe.
-- Run after 20260916090000_seo_and_guides.sql

-- ─── Rate limiting (used by the server with the secret key only) ────────────
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;

  -- Opportunistic cleanup of stale keys.
  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_hits <= p_limit;
end;
$$;
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ─── Manual orders: one transaction, row locks, atomic stock ────────────────
create or replace function public.create_manual_order(p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_subtotal bigint := 0;
  v_shipping int := coalesce((p_order->>'shipping_pence')::int, 0);
begin
  if not public.is_admin() then
    raise exception 'not_authorised' using errcode = '42501';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'no_items';
  end if;
  if (select count(distinct i->>'product_id') from jsonb_array_elements(p_items) i) <> jsonb_array_length(p_items) then
    raise exception 'duplicate_items';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 then
      raise exception 'invalid_quantity';
    end if;
    select id, title, price_pence, stock_qty, status into v_product
      from public.products where id = (v_item->>'product_id')::uuid
      for update;
    if not found then
      raise exception 'product_missing';
    end if;
    if v_product.status <> 'active' or v_product.stock_qty < v_qty then
      raise exception 'insufficient_stock:%', v_product.title;
    end if;
    v_subtotal := v_subtotal + v_product.price_pence::bigint * v_qty;
  end loop;

  if v_subtotal + v_shipping > 2147483647 then
    raise exception 'order_too_large';
  end if;

  insert into public.orders (
    channel, status, customer_name, customer_email, customer_phone,
    shipping_line1, shipping_line2, shipping_city, shipping_county, shipping_postcode,
    subtotal_pence, shipping_pence, discount_pence, total_pence, notes, paid_at
  ) values (
    (p_order->>'channel')::public.order_channel,
    (p_order->>'status')::public.order_status,
    p_order->>'customer_name',
    nullif(p_order->>'customer_email', ''),
    nullif(p_order->>'customer_phone', ''),
    nullif(p_order->>'shipping_line1', ''),
    nullif(p_order->>'shipping_line2', ''),
    nullif(p_order->>'shipping_city', ''),
    nullif(p_order->>'shipping_county', ''),
    nullif(p_order->>'shipping_postcode', ''),
    v_subtotal::int, v_shipping, 0, (v_subtotal + v_shipping)::int,
    nullif(p_order->>'notes', ''),
    case when p_order->>'status' = 'paid' then now() end
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, title, unit_price_pence, quantity, image_url)
  select v_order_id, p.id, p.title, p.price_pence, (i->>'quantity')::int,
    (select pi.url from public.product_images pi where pi.product_id = p.id order by pi.position limit 1)
  from jsonb_array_elements(p_items) i
  join public.products p on p.id = (i->>'product_id')::uuid;

  update public.products p set
    stock_qty = p.stock_qty - (i->>'quantity')::int,
    status = case when p.stock_qty - (i->>'quantity')::int = 0 then 'sold_out'::public.product_status else p.status end
  from jsonb_array_elements(p_items) i
  where p.id = (i->>'product_id')::uuid;

  return v_order_id;
end;
$$;
revoke execute on function public.create_manual_order(jsonb, jsonb) from public, anon;
grant execute on function public.create_manual_order(jsonb, jsonb) to authenticated;

-- ─── Order status changes: consistent timestamps, restock on cancel/refund ──
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_carrier text,
  p_tracking text,
  p_notes text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not_authorised' using errcode = '42501';
  end if;

  select * into v_old from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_missing';
  end if;
  if v_old.status in ('cancelled', 'refunded') and p_status not in ('cancelled', 'refunded') then
    raise exception 'order_closed';
  end if;

  update public.orders set
    status = p_status,
    carrier = p_carrier,
    tracking_number = p_tracking,
    notes = p_notes,
    paid_at = case
      when p_status = 'pending' then null
      when p_status in ('paid', 'processing', 'dispatched', 'delivered') then coalesce(v_old.paid_at, now())
      else v_old.paid_at
    end,
    dispatched_at = case
      when p_status in ('pending', 'paid', 'processing') then null
      when p_status in ('dispatched', 'delivered') then coalesce(v_old.dispatched_at, now())
      else v_old.dispatched_at
    end
  where id = p_order_id;

  if p_status in ('cancelled', 'refunded') and v_old.status not in ('cancelled', 'refunded') then
    update public.products p set
      stock_qty = p.stock_qty + i.quantity,
      status = case when p.status = 'sold_out' then 'active'::public.product_status else p.status end
    from public.order_items i
    where i.order_id = p_order_id and i.product_id = p.id;
  end if;
end;
$$;
revoke execute on function public.update_order_status(uuid, public.order_status, text, text, text) from public, anon;
grant execute on function public.update_order_status(uuid, public.order_status, text, text, text) to authenticated;

-- ─── Storage: only images, only in products/ or guides/, no overwrites ──────
drop policy if exists "Admins update product images" on storage.objects;
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images'
    and (select public.is_admin())
    and (storage.foldername(name))[1] in ('products', 'guides')
    and lower(storage.extension(name)) in ('jpg', 'png', 'webp', 'avif')
  );

-- The same stored file can't be attached to a product twice.
create unique index if not exists product_images_product_storage_path_key
  on public.product_images (product_id, storage_path) where storage_path is not null;

-- ─── Newsletter: admins can mark people as unsubscribed ─────────────────────
grant update on public.newsletter_subscribers to authenticated;
create policy "Admins update newsletter subscribers" on public.newsletter_subscribers
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
