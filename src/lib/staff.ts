import bcrypt from 'bcryptjs';
import { query, queryOne, run, batch, newId, NOW } from '@/lib/db';

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
  const existing = await queryOne('select 1 as one from users where email = $1', [args.email]);
  if (existing) throw new Error('email_taken');
  const hash = await bcrypt.hash(args.password, 10);
  const uid = newId();
  // users.email is unique, so a race here fails the batch rather than duplicating.
  await batch([
    { sql: 'insert into users (id, email, password_hash) values ($1, $2, $3)', params: [uid, args.email, hash] },
    { sql: 'insert into profiles (id, email, name, role) values ($1, $2, $3, $4)', params: [uid, args.email, args.name, args.role] },
  ]);
}

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  return queryOne<StaffMember>(
    `select pr.id, pr.name, u.email, pr.role, u.created_at
       from profiles pr join users u on u.id = pr.id
       where pr.id = $1 and pr.role in ('staff','admin')`,
    [id],
  );
}

export async function setStaffRole(userId: string, role: 'customer' | 'staff' | 'admin'): Promise<void> {
  await run('update profiles set role = $2 where id = $1', [userId, role]);
}

export async function countAdmins(): Promise<number> {
  const row = await queryOne<{ c: number }>("select count(*) as c from profiles where role = 'admin'");
  return Number(row?.c ?? 0);
}

// ---------- staff invitations ----------

export type StaffInvite = {
  id: string;
  token: string;
  email: string | null;
  role: string;
  created_at: string;
  expires_at: string | null;
  invited_by_name: string | null;
};

export async function createInvite(args: { token: string; email: string | null; role: 'staff' | 'admin'; invitedBy: string; expiresAt: string | null }): Promise<void> {
  await run(
    'insert into staff_invites (token, email, role, invited_by, expires_at) values ($1, $2, $3, $4, $5)',
    [args.token, args.email, args.role, args.invitedBy, args.expiresAt],
  );
}

/** Pending (not accepted, not revoked, not expired) invites, newest first. */
export async function listPendingInvites(): Promise<StaffInvite[]> {
  return query<StaffInvite>(
    `select i.id, i.token, i.email, i.role, i.created_at, i.expires_at, pr.name as invited_by_name
       from staff_invites i left join profiles pr on pr.id = i.invited_by
       where i.accepted_at is null and i.revoked = 0
         and (i.expires_at is null or i.expires_at > ${NOW})
       order by i.created_at desc`,
  );
}

export async function revokeInvite(id: string): Promise<void> {
  await run('update staff_invites set revoked = 1 where id = $1', [id]);
}

export type InviteForRedemption = { id: string; email: string | null; role: 'staff' | 'admin' };

const REDEEMABLE = `from staff_invites
       where token = $1 and accepted_at is null and revoked = 0
         and (expires_at is null or expires_at > ${NOW})`;

/** Returns the invite if the token is valid and redeemable, else null. */
export async function getRedeemableInvite(token: string): Promise<InviteForRedemption | null> {
  return queryOne<InviteForRedemption>(`select id, email, role ${REDEEMABLE}`, [token]);
}

/** Redeem an invite: create the staff/admin account and mark the invite used.
 *  Returns the new user id. Throws 'email_taken', 'invalid_invite'. */
export async function redeemInvite(token: string, args: { name: string; email: string; password: string }): Promise<string> {
  const invite = await getRedeemableInvite(token);
  if (!invite) throw new Error('invalid_invite');
  // If the invite is pinned to an email, enforce it.
  const email = (invite.email ?? args.email).trim().toLowerCase();

  const existing = await queryOne('select 1 as one from users where email = $1', [email]);
  if (existing) throw new Error('email_taken');

  const hash = await bcrypt.hash(args.password, 10);
  const uid = newId();
  await batch([
    { sql: 'insert into users (id, email, password_hash) values ($1, $2, $3)', params: [uid, email, hash] },
    { sql: 'insert into profiles (id, email, name, role) values ($1, $2, $3, $4)', params: [uid, email, args.name.trim(), invite.role] },
    // The guard keeps a token from being redeemed twice by two people at once.
    { sql: `update staff_invites set accepted_at = ${NOW}, accepted_user_id = $2 where id = $1 and accepted_at is null`, params: [invite.id, uid] },
  ]);
  return uid;
}
