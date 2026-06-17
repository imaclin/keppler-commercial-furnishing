import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Verify the file's leading bytes match its declared type. file.type is
// client-controlled, so we do not trust it alone.
function magicMatches(type: string, bytes: Buffer): boolean {
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === 'image/webp') return bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

// Allowed message-attachment types (photos + common documents) and their extensions.
const FILE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'application/pdf': 'pdf', 'text/plain': 'txt', 'text/csv': 'csv',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

export type SavedFile = { url: string; name: string; type: string; size: number };

// Dev: persist any allowed attachment to public/uploads and return its metadata.
// Stored under a random name; the original filename is preserved for download.
export async function saveUploadedFile(file: File): Promise<SavedFile | { error: string }> {
  const ext = FILE_EXT[file.type];
  if (!ext) return { error: 'Unsupported file type. Upload an image, PDF, or document.' };
  if (file.size > 15 * 1024 * 1024) return { error: 'Files must be under 15 MB.' };
  const bytes = Buffer.from(await file.arrayBuffer());
  const stored = `${crypto.randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, stored), bytes);
  const cleanName = (file.name || `file.${ext}`).replace(/[^\w.\- ]/g, '_').slice(0, 120);
  return { url: `/uploads/${stored}`, name: cleanName, type: file.type, size: file.size };
}

// Dev: persist to public/uploads and return a public path. Production swaps this
// for Supabase Storage; callers only depend on the returned URL string.
export async function saveUploadedImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED.has(file.type)) return { error: 'Only JPEG, PNG, or WebP images are allowed.' };
  if (file.size > 8 * 1024 * 1024) return { error: 'Images must be under 8 MB.' };
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!magicMatches(file.type, bytes)) return { error: 'File content does not match its type.' };
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const name = `${crypto.randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { url: `/uploads/${name}` };
}
