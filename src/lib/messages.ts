import { query } from '@/lib/db';
import type { Message } from '@/lib/types';

export async function listMessages(customerId: string): Promise<Message[]> {
  return query<Message>('select * from messages where customer_id = $1 order by created_at', [customerId]);
}

export async function sendMessage(customerId: string, sender: 'customer' | 'staff', body: string): Promise<void> {
  await query('insert into messages (customer_id, sender, body) values ($1, $2, $3)', [customerId, sender, body]);
}

export async function markRead(customerId: string, reader: 'customer' | 'staff'): Promise<void> {
  // mark the OTHER party's messages as read
  const other = reader === 'customer' ? 'staff' : 'customer';
  await query('update messages set read_at = now() where customer_id = $1 and sender = $2 and read_at is null', [customerId, other]);
}

export async function listMessageThreads(): Promise<{ customer_id: string; customer_name: string; last_at: string; unread: number }[]> {
  return query(
    `select m.customer_id, pr.name as customer_name, max(m.created_at) as last_at,
       count(*) filter (where m.sender = 'customer' and m.read_at is null)::int as unread
     from messages m join profiles pr on pr.id = m.customer_id
     group by m.customer_id, pr.name order by max(m.created_at) desc`,
  );
}
