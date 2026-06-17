import { readFile } from 'node:fs/promises';
import path from 'node:path';

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

// Serve user-uploaded files from public/uploads at runtime. `next start` only
// serves public/ files that existed at build time, so runtime uploads need this.
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segs } = await params;
  const rel = segs.join('/');
  const file = path.resolve(DIR, rel);
  if (!file.startsWith(DIR + path.sep)) return new Response('Forbidden', { status: 403 });
  try {
    const data = await readFile(file);
    const ext = path.extname(file).slice(1).toLowerCase();
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': TYPES[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
