import bcrypt from 'bcryptjs';
import { query, queryOne, transaction } from '@/lib/db';

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export async function listStaff(): Promise<StaffMember[]> {
  return query<StaffMember>(
    `select pr.id, pr.name, u.email, pr.role, u.created_at
       from profiles pr join users u on u.id = pr.id
       where pr.role in ('staff','admin')
       order by case pr.role when 'admin' then 0 else 1 end, pr.name`,
  );
}

/** Create a new staff/admin account. Throws 'email_taken' if the email exists. */
export async function createStaffMember(args: { email: string; name: string; password: string; role: 'staff' | 'admin' }): Promise<void> {
  await transaction(async (client) => {
    const { rows } = await client.query('select 1 from users where email = $1', [args.email]);
    if (rows.length > 0) throw new Error('email_taken');
    const hash = await bcrypt.hash(args.password, 10);
    const inserted = await client.query('insert into users (email, password_hash) values ($1, $2) returning id', [args.email, hash]);
    const uid = inserted.rows[0].id as string;
    await client.query('insert into profiles (id, email, name, role) values ($1, $2, $3, $4)', [uid, args.email, args.name, args.role]);
  });
}

export async function setStaffRole(userId: string, role: 'customer' | 'staff' | 'admin'): Promise<void> {
  await query('update profiles set role = $2 where id = $1', [userId, role]);
}

export async function countAdmins(): Promise<number> {
  const row = await queryOne<{ c: string }>("select count(*)::text as c from profiles where role = 'admin'");
  return Number(row?.c ?? 0);
}
