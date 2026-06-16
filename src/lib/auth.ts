import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import type { Profile } from '@/lib/types';

const COOKIE = 'hw_session';
const SESSION_DAYS = 30;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query('insert into sessions (token, user_id, expires_at) values ($1, $2, $3)', [
    token, userId, expires.toISOString(),
  ]);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await query('delete from sessions where token = $1', [token]);
    store.delete(COOKIE);
  }
}

export async function getProfile(): Promise<Profile | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return queryOne<Profile>(
    `select p.* from sessions s join profiles p on p.id = s.user_id
      where s.token = $1 and s.expires_at > now()`,
    [token],
  );
}

export async function requireCustomer(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'staff' && profile.role !== 'admin') redirect('/');
  return profile;
}
