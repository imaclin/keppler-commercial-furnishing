-- Invoicing: an optional Stripe (or other) payment link attached to a priced quote.
-- The priced/sent quote functions as the customer's invoice.
alter table quotes add column if not exists payment_link_url text;
