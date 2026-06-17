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

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  return queryOne<StaffMember>(
    `select pr.id, pr.name, u.email, pr.role, u.created_at
       from profiles pr join users u on u.id = pr.id
       where pr.id = $1 and pr.role in ('staff','admin')`,
    [id],
  );
}

export async function setStaffRole(userId: string, role: 'customer' | 'staff' | 'admin'): Promise<void> {
  await query('update profiles set role = $2 where id = $1', [userId, role]);
}

export async function countAdmins(): Promise<number> {
  const row = await queryOne<{ c: string }>("select count(*)::text as c from profiles where role = 'admin'");
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
  await query(
    'insert into staff_invites (token, email, role, invited_by, expires_at) values ($1, $2, $3, $4, $5)',
    [args.token, args.email, args.role, args.invitedBy, args.expiresAt],
  );
}

/** Pending (not accepted, not revoked, not expired) invites, newest first. */
export async function listPendingInvites(): Promise<StaffInvite[]> {
  return query<StaffInvite>(
    `select i.id, i.token, i.email, i.role, i.created_at, i.expires_at, pr.name as invited_by_name
       from staff_invites i left join profiles pr on pr.id = i.invited_by
       where i.accepted_at is null and i.revoked = false
         and (i.expires_at is null or i.expires_at > now())
       order by i.created_at desc`,
  );
}

export async function revokeInvite(id: string): Promise<void> {
  await query('update staff_invites set revoked = true where id = $1', [id]);
}

export type InviteForRedemption = { id: string; email: string | null; role: 'staff' | 'admin' };

/** Returns the invite if the token is valid and redeemable, else null. */
export async function getRedeemableInvite(token: string): Promise<InviteForRedemption | null> {
  return queryOne<InviteForRedemption>(
    `select id, email, role from staff_invites
       where token = $1 and accepted_at is null and revoked = false
         and (expires_at is null or expires_at > now())`,
    [token],
  );
}

/** Redeem an invite: create the staff/admin account and mark the invite used.
 *  Returns the new user id. Throws 'email_taken', 'invalid_invite'. */
export async function redeemInvite(token: string, args: { name: string; email: string; password: string }): Promise<string> {
  return transaction(async (client) => {
    const { rows: inv } = await client.query(
      `select id, email, role from staff_invites
         where token = $1 and accepted_at is null and revoked = false
           and (expires_at is null or expires_at > now()) for update`,
      [token],
    );
    if (inv.length === 0) throw new Error('invalid_invite');
    const invite = inv[0] as { id: string; email: string | null; role: 'staff' | 'admin' };
    // If the invite is pinned to an email, enforce it.
    const email = (invite.email ?? args.email).trim().toLowerCase();

    const { rows: existing } = await client.query('select 1 from users where email = $1', [email]);
    if (existing.length > 0) throw new Error('email_taken');

    const hash = await bcrypt.hash(args.password, 10);
    const created = await client.query('insert into users (email, password_hash) values ($1, $2) returning id', [email, hash]);
    const uid = created.rows[0].id as string;
    await client.query('insert into profiles (id, email, name, role) values ($1, $2, $3, $4)', [uid, email, args.name.trim(), invite.role]);
    await client.query('update staff_invites set accepted_at = now(), accepted_user_id = $2 where id = $1', [invite.id, uid]);
    return uid;
  });
}
