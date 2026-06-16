import { query, queryOne, transaction } from '@/lib/db';
import type { Order, OrderItem, OrderStatusEvent, OrderStatus } from '@/lib/types';

export async function listOrdersForCustomer(customerId: string): Promise<Order[]> {
  return query<Order>('select * from orders where customer_id = $1 order by created_at desc', [customerId]);
}

export async function getOrderForCustomer(id: string, customerId: string): Promise<(Order & { items: OrderItem[]; history: OrderStatusEvent[] }) | null> {
  const order = await queryOne<Order>('select * from orders where id = $1 and customer_id = $2', [id, customerId]);
  if (!order) return null;
  const [items, history] = await Promise.all([
    query<OrderItem>('select * from order_items where order_id = $1', [id]),
    query<OrderStatusEvent>('select * from order_status_history where order_id = $1 order by created_at', [id]),
  ]);
  return { ...order, items, history };
}

export async function activeOrderForCustomer(customerId: string): Promise<Order | null> {
  return queryOne<Order>(
    "select * from orders where customer_id = $1 and status <> 'delivered' and status <> 'cancelled' order by created_at desc limit 1",
    [customerId],
  );
}

export async function listOrdersForAdmin(): Promise<(Order & { customer_name: string })[]> {
  return query(
    `select o.*, pr.name as customer_name from orders o join profiles pr on pr.id = o.customer_id order by o.created_at desc`,
  );
}

export async function getOrderForAdmin(id: string): Promise<(Order & { customer_name: string; items: OrderItem[]; history: OrderStatusEvent[] }) | null> {
  const order = await queryOne<Order & { customer_name: string }>(
    'select o.*, pr.name as customer_name from orders o join profiles pr on pr.id = o.customer_id where o.id = $1', [id],
  );
  if (!order) return null;
  const [items, history] = await Promise.all([
    query<OrderItem>('select * from order_items where order_id = $1', [id]),
    query<OrderStatusEvent>('select * from order_status_history where order_id = $1 order by created_at', [id]),
  ]);
  return { ...order, items, history };
}

export async function advanceOrderStatus(orderId: string, status: OrderStatus, note: string | null): Promise<void> {
  await transaction(async (client) => {
    await client.query('update orders set status = $2 where id = $1', [orderId, status]);
    await client.query('insert into order_status_history (order_id, status, note) values ($1, $2, $3)', [orderId, status, note]);
  });
}

export async function setEstDelivery(orderId: string, date: string | null): Promise<void> {
  await query('update orders set est_delivery_date = $2 where id = $1', [orderId, date]);
}

export async function orderCounts(): Promise<{ open: number; quotesPending: number; inProduction: number }> {
  const row = await queryOne<{ open: string; pending: string; prod: string }>(
    `select (select count(*) from orders where status not in ('delivered','cancelled'))::text as open,
            (select count(*) from quotes where status = 'requested')::text as pending,
            (select count(*) from orders where status = 'in_production')::text as prod`,
  );
  return { open: Number(row?.open ?? 0), quotesPending: Number(row?.pending ?? 0), inProduction: Number(row?.prod ?? 0) };
}
