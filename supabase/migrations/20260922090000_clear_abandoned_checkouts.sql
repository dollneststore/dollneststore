-- Tidy the orders list.
--
-- Card checkout writes a 'pending' order before the customer is sent to Stripe, so every
-- closed tab or changed mind leaves a row that was never paid for. This removes the ones
-- already in the table. From now on the Stripe webhook deletes them by itself when the
-- checkout session expires (enable the 'checkout.session.expired' event on the endpoint).
--
-- Deliberately narrow, so nothing real is lost:
--   * only orders taken on the website (a WhatsApp/Etsy order recorded by hand is kept,
--     even while it is still awaiting payment);
--   * only 'pending' — a paid, dispatched, cancelled or refunded order is never touched;
--   * only rows with no payment attached at all;
--   * only ones older than an hour, so a checkout in progress right now survives.
-- Order items are removed with the order (on delete cascade). Safe to run more than once.

with removed as (
  delete from public.orders
   where status = 'pending'
     and channel = 'website'
     and paid_at is null
     and stripe_checkout_session_id is null
     and stripe_payment_intent_id is null
     and created_at < now() - interval '1 hour'
  returning order_number
)
select count(*) as abandoned_orders_removed from removed;
