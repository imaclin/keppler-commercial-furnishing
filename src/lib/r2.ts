import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Public media (product photos, 360 frames, admin-uploaded images) lives in a
// Cloudflare R2 bucket and is served from its CDN domain, not from this app.
// Vercel's filesystem is read-only and wiped between deploys, so anything an
// admin uploads has to be written somewhere outside the app to survive.
//
// The bucket is shared with another MIND project for now. Every key this app
// writes starts with PREFIX, so the two can never overwrite each other and
// Keppler's media can be moved to its own bucket later by copying one folder.
//
// Only public files belong here: a public bucket serves any key it holds to
// anyone who has the URL. Private files (customer message attachments) must
// not be written through this module.

const PREFIX = 'keppler';

type R2Config = { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string; publicBase: string };

function readConfig(): R2Config | null {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBase) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey, publicBase: publicBase.replace(/\/+$/, '') };
}

/** True when R2 is configured. Local development without the env vars falls back to disk. */
export function r2Enabled(): boolean {
  return readConfig() !== null;
}

let client: S3Client | null = null;
function getClient(cfg: R2Config): S3Client {
  client ??= new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
  return client;
}

/** Joins path segments under this app's prefix, dropping anything that could climb out of it. */
export function mediaKey(...parts: string[]): string {
  const clean = parts
    .flatMap((p) => p.split('/'))
    .map((p) => p.trim())
    .filter((p) => p && p !== '.' && p !== '..');
  return [PREFIX, ...clean].join('/');
}

/**
 * Uploads a public file and returns the URL it is served from. Keys should be
 * unique per content (a random id or a content hash), which is what makes the
 * year-long immutable cache header safe.
 */
export async function putPublicMedia(key: string, body: Uint8Array, contentType: string): Promise<string> {
  const cfg = readConfig();
  if (!cfg) throw new Error('R2 is not configured');
  if (!key.startsWith(`${PREFIX}/`)) throw new Error(`Media keys must start with ${PREFIX}/`);
  await getClient(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${cfg.publicBase}/${key}`;
}
