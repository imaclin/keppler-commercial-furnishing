import { query } from '@/lib/db';

export type CommandItem = {
  id: string;
  group: string;
  label: string;
  sublabel?: string;
  href: string;
};

/** Lightweight searchable index of admin entities for the command palette.
 *  Read-only, capped, and cheap; refreshed on each admin page load. */
export async function adminCommandItems(): Promise<CommandItem[]> {
  const [products, customers, orders] = await Promise.all([
    query<{ id: string; name: string; category: string }>(
      'select id, name, category from products order by name limit 200',
    ),
    query<{ id: string; name: string; email: string }>(
      "select pr.id, pr.name, u.email from profiles pr join users u on u.id = pr.id where pr.role = 'customer' order by pr.name limit 200",
    ),
    query<{ id: string; status: string; name: string }>(
      'select o.id, o.status, pr.name from orders o join profiles pr on pr.id = o.customer_id order by o.created_at desc limit 200',
    ),
  ]);

  return [
    ...products.map((p) => ({
      id: `product-${p.id}`,
      group: 'Products',
      label: p.name,
      sublabel: p.category,
      href: `/admin/products/${p.id}`,
    })),
    ...customers.map((c) => ({
      id: `customer-${c.id}`,
      group: 'Customers',
      label: c.name,
      sublabel: c.email,
      href: `/admin/customers/${c.id}`,
    })),
    ...orders.map((o) => ({
      id: `order-${o.id}`,
      group: 'Orders',
      label: `#${o.id.slice(0, 8)} · ${o.name}`,
      sublabel: o.status.replaceAll('_', ' '),
      href: `/admin/orders/${o.id}`,
    })),
  ];
}
