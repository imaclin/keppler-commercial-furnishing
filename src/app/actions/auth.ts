'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { transaction, queryOne } from '@/lib/db';
import { createSession } from '@/lib/auth';
import type { User } from '@/lib/types';

export type ActionState = { error: string } | null;

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!email || !password || !name) return { error: 'All fields are required.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

  let userId = '';
  try {
    userId = await transaction(async (client) => {
      const { rows: existing } = await client.query('select 1 from users where email = $1', [email]);
      if (existing.length > 0) throw new Error('email_taken');
      const hash = await bcrypt.hash(password, 10);
      const { rows } = await client.query(
        'insert into users (email, password_hash) values ($1, $2) returning id', [email, hash],
      );
      const uid = rows[0].id as string;
      await client.query(
        "insert into profiles (id, email, name, role) values ($1, $2, $3, 'customer')",
        [uid, email, name],
      );
      return uid;
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'email_taken') {
      return { error: 'An account with that email already exists.' };
    }
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === '23505') {
      return { error: 'An account with that email already exists.' };
    }
    return { error: 'Could not create your account. Please try again.' };
  }
  await createSession(userId);
  redirect('/account');
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Email and password are required.' };
  let role = 'customer';
  try {
    const user = await queryOne<User & { role: string }>(
      'select u.id, u.password_hash, p.role from users u join profiles p on p.id = u.id where u.email = $1',
      [email],
    );
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return { error: 'Invalid email or password.' };
    }
    role = user.role;
    await createSession(user.id);
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
  redirect(role === 'staff' || role === 'admin' ? '/admin' : '/account');
}
