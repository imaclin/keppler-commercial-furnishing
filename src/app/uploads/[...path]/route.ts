import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getProfile } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { getPrivateFile } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DIR = path.join(process.cwd(), 'public', 'uploads');

const TYPES: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// Serves uploaded files. Message attachments are private customer documents:
// staff may read any of them, a customer only those on their own thread, and
// nobody reads one without being signed in. (Public media has its own route,
// /media, and never comes through here.)
//
// On Workers the file comes from the PRIVATE bucket. In local development it
// is read from public/uploads, where the same uploads were written.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segs } = await params;
  if (segs.length !== 1 || !/^[\w.-]+$/.test(segs[0])) return new Response('Not found', { status: 404 });
  const name = segs[0];

  const profile = await getProfile();
  if (!profile) return new Response('Sign in to open this file.', { status: 401 });
  if (profile.role === 'customer') {
    const own = await queryOne<{ id: string }>(
      `select id from messages where customer_id = $1 and attachments::text like $2 limit 1`,
      [profile.id, `%/uploads/${name}%`],
    );
    if (!own) return new Response('Not found', { status: 404 });
  }

  const ext = path.extname(name).slice(1).toLowerCase();
  const type = TYPES[ext] ?? 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Cache-Control': 'private, max-age=3600' };

  const stored = await getPrivateFile(name);
  if (stored?.body) {
    return new Response(stored.body, {
      headers: { ...headers, 'Content-Type': stored.httpMetadata?.contentType ?? type, ...(stored.httpMetadata?.contentDisposition ? { 'Content-Disposition': stored.httpMetadata.contentDisposition } : {}) },
    });
  }

  const file = path.resolve(DIR, name);
  if (!file.startsWith(DIR + path.sep)) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), { headers });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
