import { query, queryOne, transaction } from '@/lib/db';
import type { Quote, QuoteItem } from '@/lib/types';

export async function createQuoteFromConfig(customerId: string, item: {
  productId: string | null; title: string; woodName: string | null; finishName: string | null;
  sizeLabel: string | null; unitPriceCents: number; configuration: Record<string, unknown> | null;
}): Promise<string> {
  return transaction(async (client) => {
    const { rows } = await client.query(
      `insert into quotes (customer_id, status, subtotal_cents, total_cents)
       values ($1, 'requested', $2, $2) returning id`,
      [customerId, item.unitPriceCents],
    );
    const id = rows[0].id as string;
    await client.query(
      `insert into quote_items (quote_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json)
       values ($1, $2, $3, $4, $5, $6, 1, $7, $8)`,
      [id, item.productId, item.title, item.woodName, item.finishName, item.sizeLabel, item.unitPriceCents,
       item.configuration ? JSON.stringify(item.configuration) : null],
    );
    return id;
  });
}

export type CartQuoteItem = {
  productId: string | null; title: string; woodName: string | null; finishName: string | null;
  sizeLabel: string | null; unitPriceCents: number; quantity: number; configuration: Record<string, unknown> | null;
};

// Create a single quote request from a cart of configured items.
export async function createQuoteFromItems(customerId: string, items: CartQuoteItem[]): Promise<string> {
  return transaction(async (client) => {
    const subtotal = items.reduce((s, i) => s + i.unitPriceCents * Math.max(1, i.quantity), 0);
    const { rows } = await client.query(
      `insert into quotes (customer_id, status, subtotal_cents, total_cents)
       values ($1, 'requested', $2, $2) returning id`,
      [customerId, subtotal],
    );
    const id = rows[0].id as string;
    for (const it of items) {
      await client.query(
        `insert into quote_items (quote_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, it.productId, it.title, it.woodName, it.finishName, it.sizeLabel, Math.max(1, it.quantity), it.unitPriceCents,
         it.configuration ? JSON.stringify(it.configuration) : null],
      );
    }
    return id;
  });
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
    `select q.*, pr.name as customer_name, (select count(*)::int from quote_items qi where qi.quote_id = q.id) as item_count
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
export async function priceAndSendQuote(quoteId: string, prices: Record<string, number>, validUntil: string | null, notes: string | null, paymentLinkUrl: string | null = null): Promise<void> {
  await transaction(async (client) => {
    const { rows: qrows } = await client.query('select status from quotes where id = $1 for update', [quoteId]);
    if (!qrows[0] || !['requested', 'sent'].includes(qrows[0].status as string)) {
      throw new Error('Quote is not in a priceable state');
    }
    let subtotal = 0;
    const { rows: items } = await client.query('select id, quantity from quote_items where quote_id = $1', [quoteId]);
    for (const it of items) {
      const unit = prices[it.id as string];
      if (unit === undefined || !Number.isFinite(unit) || unit < 0) throw new Error('Invalid price for a quote item');
      subtotal += unit * (it.quantity as number);
      await client.query('update quote_items set unit_price_cents = $2 where id = $1', [it.id, unit]);
    }
    await client.query(
      `update quotes set subtotal_cents = $2, total_cents = $2, valid_until = $3, notes = $4, payment_link_url = $5, status = 'sent' where id = $1`,
      [quoteId, subtotal, validUntil, notes, paymentLinkUrl],
    );
  });
}

// Customer accepts a sent quote -> creates a confirmed order (snapshotting items) and marks the quote accepted.
export async function acceptQuote(quoteId: string, customerId: string): Promise<string | null> {
  return transaction(async (client) => {
    const { rows: qrows } = await client.query(
      "select * from quotes where id = $1 and customer_id = $2 and status = 'sent' for update", [quoteId, customerId],
    );
    const quote = qrows[0];
    if (!quote) return null;
    const { rows: orows } = await client.query(
      `insert into orders (customer_id, quote_id, status, subtotal_cents, total_cents)
       values ($1, $2, 'confirmed', $3, $4) returning id`,
      [customerId, quoteId, quote.subtotal_cents, quote.total_cents],
    );
    const orderId = orows[0].id as string;
    await client.query(
      `insert into order_items (order_id, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json)
       select $1, product_id, title_snapshot, wood_name, finish_name, size_label, quantity, unit_price_cents, configuration_json
         from quote_items where quote_id = $2`,
      [orderId, quoteId],
    );
    await client.query("insert into order_status_history (order_id, status, note) values ($1, 'confirmed', 'Order confirmed from accepted quote')", [orderId]);
    await client.query("update quotes set status = 'accepted' where id = $1", [quoteId]);
    return orderId;
  });
}
