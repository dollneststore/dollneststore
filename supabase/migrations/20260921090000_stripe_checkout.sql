-- Card checkout. Two rules are enforced here rather than in the browser:
--   1. an order is priced from the products table, never from what the basket says;
--   2. an order becomes 'paid' only through mark_order_paid, which the verified Stripe
--      webhook calls with the service key.
-- Safe to run more than once.

-- Which code was used, so the usage counter can be trusted and the admin can see it.
alter table public.orders add column if not exists discount_code text;

-- ─── Create a pending order, priced by the database ─────────────────────────
create or replace function public.create_checkout_order(
  p_items jsonb,
  p_code text default null,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_item jsonb;
  v_id uuid;
  v_qty int;
  v_title text;
  v_price int;
  v_stock int;
  v_status text;
  v_image text;
  v_subtotal int := 0;
  v_discount int := 0;
  v_percent int;
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
  v_order_id uuid;
  v_order_number text;
  v_lines jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 20 then
    raise exception 'basket_invalid';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'quantity_invalid';
    end if;

    -- Locked for the length of this transaction so two checkouts can't both pass the stock check.
    select p.title, p.price_pence, p.stock_qty, p.status::text
      into v_title, v_price, v_stock, v_status
      from public.products p
     where p.id = v_id
     for update;

    if v_title is null then raise exception 'product_missing'; end if;
    if v_status <> 'active' then raise exception 'product_unavailable:%', v_title; end if;
    if v_stock < v_qty then raise exception 'stock_short:%', v_title; end if;

    select pi.url into v_image
      from public.product_images pi
     where pi.product_id = v_id
     order by pi.position
     limit 1;

    v_subtotal := v_subtotal + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_id, 'title', v_title,
      'unit_price_pence', v_price, 'quantity', v_qty, 'image_url', v_image);
  end loop;

  -- The discount is re-checked here too: the browser only ever sends the code.
  if v_code <> '' then
    select d.percent_off into v_percent
      from public.discount_codes d
     where d.code = v_code
       and d.is_active
       and (d.starts_at is null or d.starts_at <= pg_catalog.now())
       and (d.expires_at is null or d.expires_at > pg_catalog.now())
       and (d.max_uses is null or d.times_used < d.max_uses);
    if v_percent is null then
      v_code := '';
    else
      v_discount := pg_catalog.round(v_subtotal * v_percent / 100.0);
    end if;
  end if;

  insert into public.orders (
    status, channel, customer_name, customer_email,
    subtotal_pence, shipping_pence, discount_pence, total_pence, discount_code
  ) values (
    'pending', 'website', 'Awaiting payment', nullif(p_email, ''),
    v_subtotal, 0, v_discount, v_subtotal - v_discount, nullif(v_code, '')
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.order_items (order_id, product_id, title, unit_price_pence, quantity, image_url)
  select v_order_id,
         (line->>'product_id')::uuid,
         line->>'title',
         (line->>'unit_price_pence')::int,
         (line->>'quantity')::int,
         line->>'image_url'
    from jsonb_array_elements(v_lines) as line;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal_pence', v_subtotal,
    'discount_pence', v_discount,
    'total_pence', v_subtotal - v_discount,
    'discount_code', nullif(v_code, ''),
    'items', v_lines
  );
end;
$fn$;

revoke all on function public.create_checkout_order(jsonb, text, text) from public;
grant execute on function public.create_checkout_order(jsonb, text, text) to anon, authenticated;

-- ─── Mark an order paid (webhook only) ──────────────────────────────────────
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_session_id text,
  p_payment_intent text,
  p_name text default null,
  p_email text default null,
  p_phone text default null,
  p_line1 text default null,
  p_line2 text default null,
  p_city text default null,
  p_county text default null,
  p_postcode text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_status text;
  v_code text;
  v_item record;
  v_short boolean := false;
begin
  select o.status::text, o.discount_code into v_status, v_code
    from public.orders o
   where o.id = p_order_id
   for update;

  if v_status is null then return 'missing'; end if;
  -- Stripe retries webhooks, so paying twice must change nothing.
  if v_status <> 'pending' then return 'already'; end if;

  for v_item in
    select oi.product_id, oi.quantity from public.order_items oi where oi.order_id = p_order_id
  loop
    update public.products p
       set stock_qty = p.stock_qty - v_item.quantity,
           status = case when p.stock_qty - v_item.quantity <= 0 then 'sold_out'::public.product_status else p.status end
     where p.id = v_item.product_id
       and p.stock_qty >= v_item.quantity;
    if not found then v_short := true; end if;
  end loop;

  update public.orders
     set status = 'paid',
         paid_at = pg_catalog.now(),
         stripe_checkout_session_id = p_session_id,
         stripe_payment_intent_id = p_payment_intent,
         customer_name = coalesce(nullif(p_name, ''), customer_name),
         customer_email = coalesce(nullif(p_email, ''), customer_email),
         customer_phone = coalesce(nullif(p_phone, ''), customer_phone),
         shipping_line1 = coalesce(nullif(p_line1, ''), shipping_line1),
         shipping_line2 = coalesce(nullif(p_line2, ''), shipping_line2),
         shipping_city = coalesce(nullif(p_city, ''), shipping_city),
         shipping_county = coalesce(nullif(p_county, ''), shipping_county),
         shipping_postcode = coalesce(nullif(p_postcode, ''), shipping_postcode),
         notes = case when v_short
                      then pg_catalog.concat_ws(' ', notes, '[Paid but stock had already gone — check before dispatch.]')
                      else notes end
   where id = p_order_id;

  -- Now the usage limit on a discount code means something.
  if v_code is not null then
    update public.discount_codes set times_used = times_used + 1 where code = v_code;
  end if;

  return case when v_short then 'paid_without_stock' else 'paid' end;
end;
$fn$;

revoke all on function public.mark_order_paid(uuid, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.mark_order_paid(uuid, text, text, text, text, text, text, text, text, text, text) to service_role;
