import { query } from '@/lib/db';
import type { Message, Attachment } from '@/lib/types';

export async function listMessages(customerId: string): Promise<Message[]> {
  return query<Message>('select * from messages where customer_id = $1 order by created_at', [customerId]);
}

export async function sendMessage(customerId: string, sender: 'customer' | 'staff', body: string, attachments: Attachment[] = []): Promise<void> {
  await query('insert into messages (customer_id, sender, body, attachments) values ($1, $2, $3, $4)', [customerId, sender, body, JSON.stringify(attachments)]);
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

export type MessageThreadRich = {
  customer_id: string;
  customer_name: string;
  last_body: string;
  last_sender: string;
  last_at: string;
  unread: number;
};

export async function listMessageThreadsRich(): Promise<MessageThreadRich[]> {
  const rows = await query<MessageThreadRich>(`
    select distinct on (m.customer_id)
      m.customer_id,
      pr.name as customer_name,
      m.body as last_body,
      m.sender as last_sender,
      m.created_at as last_at,
      (select count(*) from messages mm where mm.customer_id = m.customer_id and mm.sender = 'customer' and mm.read_at is null)::int as unread
    from messages m
    join profiles pr on pr.id = m.customer_id
    order by m.customer_id, m.created_at desc
  `);
  // distinct on requires ordering by customer_id, so re-sort by last_at desc here
  return rows.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
}
