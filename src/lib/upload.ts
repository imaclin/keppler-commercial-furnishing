import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Dev: persist to public/uploads and return a public path. Production swaps this
// for Supabase Storage; callers only depend on the returned URL string.
export async function saveUploadedImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED.has(file.type)) return { error: 'Only JPEG, PNG, or WebP images are allowed.' };
  if (file.size > 8 * 1024 * 1024) return { error: 'Images must be under 8 MB.' };
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${crypto.randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { url: `/uploads/${name}` };
}
