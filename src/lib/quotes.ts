import { query, queryOne, batch, newId, type Statement } from '@/lib/db';
import type { Quote, QuoteItem } from '@/lib/types';

export async function createQuoteFromConfig(customerId: string, item: {
  productId: string | null; title: string; woodName: string | null; finishName: string | null;
  sizeLabel: string | null; unitPriceCents: number; configuration: Record<string, unknown> | null;
}): Promise<string> {
  const id = newId();
  await batch([
    {
      sql: `insert into quotes (id, customer_id, status, subtotal_cents, total_cents) values ($1, $2, 'requested', $3, $3)`,
      params: [id, customerId, item.unitPriceCents],
    },
    {
      sql: `insert into quote_items (quote_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json)
            values ($1, $2, $3, $4, $5, $6, 1, $7, $8)`,
      params: [id, item.productId, item.title, item.woodName, item.finishName, item.sizeLabel, item.unitPriceCents,
        item.configuration ? JSON.stringify(item.configuration) : null],
    },
  ]);
  return id;
}

export type CartQuoteItem = {
  productId: string | null; title: string; woodName: string | null; finishName: string | null;
  sizeLabel: string | null; unitPriceCents: number; quantity: number; configuration: Record<string, unknown> | null;
};

// Create a single quote request from a cart of configured items.
export async function createQuoteFromItems(customerId: string, items: CartQuoteItem[]): Promise<string> {
  const id = newId();
  const subtotal = items.reduce((s, i) => s + i.unitPriceCents * Math.max(1, i.quantity), 0);
  const stmts: Statement[] = [{
    sql: `insert into quotes (id, customer_id, status, subtotal_cents, total_cents) values ($1, $2, 'requested', $3, $3)`,
    params: [id, customerId, subtotal],
  }];
  for (const it of items) {
    stmts.push({
      sql: `insert into quote_items (quote_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json)
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      params: [id, it.productId, it.title, it.woodName, it.finishName, it.sizeLabel, Math.max(1, it.quantity), it.unitPriceCents,
        it.configuration ? JSON.stringify(it.configuration) : null],
    });
  }
  await batch(stmts);
  return id;
}

export async function listQuotesForCustomer(customerId: string): Promise<Quote[]> {
  return query<Quote>('select * from quotes where customer_id = $1 order by created_at desc', [customerId]);
}

export async function getQuoteForCustomer(id: string, customerId: string): Promise<(Quote & { items: QuoteItem[] }) | null> {
  const quote = await queryOne<Quote>('select * from quotes where id = $1 and customer_id = $2', [id, customerId]);
  if (!quote) return null;
  const items = await query<QuoteItem>('select * from quote_items where quote_id = $1', [id]);
  return { ...quote, items };
}

export async function listQuotesForAdmin(): Promise<(Quote & { customer_name: string; item_count: number })[]> {
  return query(
    `select q.*, pr.name as customer_name, (select count(*) from quote_items qi where qi.quote_id = q.id) as item_count
       from quotes q join profiles pr on pr.id = q.customer_id
      order by case q.status when 'requested' then 0 else 1 end, q.created_at desc`,
  );
}

export type AdminQuoteItem = QuoteItem & { image_url: string | null };
export async function getQuoteForAdmin(id: string): Promise<(Quote & { customer_name: string; customer_email: string; items: AdminQuoteItem[] }) | null> {
  const quote = await queryOne<Quote & { customer_name: string; customer_email: string }>(
    `select q.*, pr.name as customer_name, u.email as customer_email
       from quotes q join profiles pr on pr.id = q.customer_id join users u on u.id = pr.id
      where q.id = $1`, [id],
  );
  if (!quote) return null;
  const items = await query<AdminQuoteItem>(
    `select qi.*, (select url from product_images i where i.product_id = qi.product_id order by i.sort_order limit 1) as image_url
       from quote_items qi where qi.quote_id = $1`, [id],
  );
  return { ...quote, items };
}

// Staff: set per-item prices, valid-until, notes, mark sent. prices keyed by quote_item id.
// Reads and checks first, then writes everything in one batch; the final update
// re-checks the status so a quote accepted in between is never re-priced.
export async function priceAndSendQuote(quoteId: string, prices: Record<string, number>, validUntil: string | null, notes: string | null, paymentLinkUrl: string | null = null): Promise<void> {
  const q = await queryOne<{ status: string }>('select status from quotes where id = $1', [quoteId]);
  if (!q || !['requested', 'sent'].includes(q.status)) {
    throw new Error('Quote is not in a priceable state');
  }
  const items = await query<{ id: string; quantity: number }>('select id, quantity from quote_items where quote_id = $1', [quoteId]);
  let subtotal = 0;
  const stmts: Statement[] = [];
  for (const it of items) {
    const unit = prices[it.id];
    if (unit === undefined || !Number.isFinite(unit) || unit < 0) throw new Error('Invalid price for a quote item');
    subtotal += unit * it.quantity;
    stmts.push({ sql: 'update quote_items set unit_price_cents = $2 where id = $1', params: [it.id, unit] });
  }
  stmts.push({
    sql: `update quotes set subtotal_cents = $2, total_cents = $2, valid_until = $3, notes = $4, payment_link_url = $5, status = 'sent'
           where id = $1 and status in ('requested', 'sent')`,
    params: [quoteId, subtotal, validUntil, notes, paymentLinkUrl],
  });
  await batch(stmts);
}

// Customer accepts a sent quote -> creates a confirmed order (snapshotting items) and marks the quote accepted.
export async function acceptQuote(quoteId: string, customerId: string): Promise<string | null> {
  const quote = await queryOne<Quote>(
    "select * from quotes where id = $1 and customer_id = $2 and status = 'sent'", [quoteId, customerId],
  );
  if (!quote) return null;
  const orderId = newId();
  await batch([
    {
      sql: `insert into orders (id, customer_id, quote_id, status, subtotal_cents, total_cents) values ($1, $2, $3, 'confirmed', $4, $5)`,
      params: [orderId, customerId, quoteId, quote.subtotal_cents, quote.total_cents],
    },
    {
      sql: `insert into order_items (order_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json)
            select $1, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json
              from quote_items where quote_id = $2`,
      params: [orderId, quoteId],
    },
    { sql: "insert into order_status_history (order_id, status, note) values ($1, 'confirmed', 'Order confirmed from accepted quote')", params: [orderId] },
    { sql: "update quotes set status = 'accepted' where id = $1 and status = 'sent'", params: [quoteId] },
  ]);
  return orderId;
}
