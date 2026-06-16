import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash } from 'crypto';
import { query, queryOne } from '@/lib/db';
import type { Profile } from '@/lib/types';

const COOKIE = 'hw_session';
const SESSION_DAYS = 30;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query('insert into sessions (token, user_id, expires_at) values ($1, $2, $3)', [
    hashToken(token), userId, expires.toISOString(),
  ]);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires,
  });
}

// Intentionally idempotent: no-op when no cookie is present.
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await query('delete from sessions where token = $1', [hashToken(token)]);
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
    [hashToken(token)],
  );
}

// Requires a signed-in account. Any role (customer or staff) may access their own
// account area; this gates authentication, not the customer role specifically.
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
