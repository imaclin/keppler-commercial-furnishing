import { query } from '@/lib/db';

export async function createInquiry(args: {
  productId: string | null; name: string; email: string; message: string | null;
  configuration: Record<string, unknown> | null;
}): Promise<void> {
  await query(
    `insert into inquiries (product_id, name, email, message, configuration_json)
     values ($1, $2, $3, $4, $5)`,
    [args.productId, args.name, args.email, args.message, args.configuration ? JSON.stringify(args.configuration) : null],
  );
}
