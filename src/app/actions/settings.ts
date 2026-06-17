'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { requireStaff } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { updateSiteSettings, type SiteSettingsInput } from '@/lib/settings';
import { createStaffMember, setStaffRole, countAdmins } from '@/lib/staff';

export type Result = { ok: true } | { error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const u = await queryOne<{ password_hash: string }>('select password_hash from users where id = $1', [userId]);
  if (!u) return false;
  return bcrypt.compare(password, u.password_hash);
}

// ---------- own account ----------

export async function updateAccountNameAction(name: string): Promise<Result> {
  const profile = await requireStaff();
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Name is required.' };
  if (trimmed.length > 80) return { error: 'Name must be 80 characters or fewer.' };
  await query('update profiles set name = $2 where id = $1', [profile.id, trimmed]);
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function changeEmailAction(currentPassword: string, newEmail: string): Promise<Result> {
  const profile = await requireStaff();
  const email = newEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: 'Enter a valid email address.' };
  if (email === profile.email.toLowerCase()) return { error: 'That is already your email.' };
  if (!(await verifyPassword(profile.id, currentPassword))) return { error: 'Current password is incorrect.' };
  const existing = await queryOne<{ id: string }>('select id from users where email = $1', [email]);
  if (existing) return { error: 'Another account already uses that email.' };
  await query('update users set email = $2 where id = $1', [profile.id, email]);
  await query('update profiles set email = $2 where id = $1', [profile.id, email]);
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<Result> {
  const profile = await requireStaff();
  if (newPassword.length < 8) return { error: 'New password must be at least 8 characters.' };
  if (!(await verifyPassword(profile.id, currentPassword))) return { error: 'Current password is incorrect.' };
  const hash = await bcrypt.hash(newPassword, 10);
  await query('update users set password_hash = $2 where id = $1', [profile.id, hash]);
  return { ok: true };
}

// ---------- web details ----------

export async function updateSiteSettingsAction(input: SiteSettingsInput): Promise<Result> {
  await requireStaff();
  if (!input.site_title.trim()) return { error: 'Site title is required.' };
  if (input.contact_email && !EMAIL_RE.test(input.contact_email)) return { error: 'Enter a valid contact email.' };
  await updateSiteSettings(input);
  revalidatePath('/admin/web');
  return { ok: true };
}

// ---------- staff management ----------

export async function addStaffAction(input: { name: string; email: string; password: string; role: 'staff' | 'admin' }): Promise<Result> {
  await requireStaff();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { error: 'Name is required.' };
  if (!EMAIL_RE.test(email)) return { error: 'Enter a valid email address.' };
  if (input.password.length < 8) return { error: 'Password must be at least 8 characters.' };
  try {
    await createStaffMember({ name, email, password: input.password, role: input.role });
  } catch (e) {
    if (e instanceof Error && e.message === 'email_taken') return { error: 'An account with that email already exists.' };
    return { error: 'Could not create the staff member.' };
  }
  revalidatePath('/admin/staff');
  return { ok: true };
}

export async function setStaffRoleAction(userId: string, role: 'staff' | 'admin'): Promise<Result> {
  await requireStaff();
  // Never leave the business without an admin.
  if (role !== 'admin') {
    const current = await queryOne<{ role: string }>('select role from profiles where id = $1', [userId]);
    if (current?.role === 'admin' && (await countAdmins()) <= 1) {
      return { error: 'You cannot remove the last admin.' };
    }
  }
  await setStaffRole(userId, role);
  revalidatePath('/admin/staff');
  return { ok: true };
}
