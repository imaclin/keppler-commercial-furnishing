// File storage.
//
// On Cloudflare Workers the app talks to its two R2 buckets through bindings
// (wrangler.jsonc): MEDIA for public files, PRIVATE for customer attachments.
// No credentials involved. Public files are served by this app at /media/<key>,
// so their URLs are relative and never depend on which domain the site is on.
//
// Elsewhere (local `next dev`, tests) there are no bindings. Public media can
// still go to an S3-compatible bucket if the R2_* env vars are set; otherwise
// callers fall back to writing under public/uploads.

import type { PutObjectCommand as PutObjectCommandType, S3Client as S3ClientType } from '@aws-sdk/client-s3';

const PREFIX = 'keppler';

type R2Object = { body: ReadableStream | null; httpMetadata?: { contentType?: string; cacheControl?: string; contentDisposition?: string }; size: number; httpEtag: string };
type R2Bucket = {
  put(key: string, body: Uint8Array | ArrayBuffer | string, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string; contentDisposition?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
  head(key: string): Promise<{ size: number } | null>;
};
type Buckets = { media: R2Bucket; private: R2Bucket };

const onWorkers = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

export async function buckets(): Promise<Buckets | null> {
  if (!onWorkers) return null;
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const env = (await getCloudflareContext({ async: true })).env as { MEDIA?: R2Bucket; PRIVATE?: R2Bucket };
  if (!env.MEDIA || !env.PRIVATE) return null;
  return { media: env.MEDIA, private: env.PRIVATE };
}

// ----------------------------------------------------------- S3 fallback

type S3Config = { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string; publicBase: string };

function s3Config(): S3Config | null {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBase) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey, publicBase: publicBase.replace(/\/+$/, '') };
}

let s3: S3ClientType | null = null;
async function s3Client(cfg: S3Config): Promise<{ client: S3ClientType; PutObjectCommand: typeof PutObjectCommandType }> {
  const mod = await import('@aws-sdk/client-s3');
  s3 ??= new mod.S3Client({ region: 'auto', endpoint: cfg.endpoint, credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey } });
  return { client: s3, PutObjectCommand: mod.PutObjectCommand };
}

// ------------------------------------------------------------------ API

/** True when uploads can be stored durably (a bucket binding or S3 config). */
export async function r2Enabled(): Promise<boolean> {
  return (await buckets()) !== null || s3Config() !== null;
}

/** Joins path segments under this app's prefix, dropping anything that could climb out of it. */
export function mediaKey(...parts: string[]): string {
  const clean = parts
    .flatMap((p) => p.split('/'))
    .map((p) => p.trim())
    .filter((p) => p && p !== '.' && p !== '..');
  return [PREFIX, ...clean].join('/');
}

/** The URL a public media key is served from. */
export function mediaUrl(key: string): string {
  return `/media/${key}`;
}

/**
 * Stores a public file and returns the URL it is served from. Keys should be
 * unique per content (a random id or a content hash), which is what makes the
 * year-long immutable cache header safe.
 */
export async function putPublicMedia(key: string, body: Uint8Array, contentType: string): Promise<string> {
  if (!key.startsWith(`${PREFIX}/`)) throw new Error(`Media keys must start with ${PREFIX}/`);
  const cacheControl = 'public, max-age=31536000, immutable';
  const b = await buckets();
  if (b) {
    await b.media.put(key, body, { httpMetadata: { contentType, cacheControl } });
    return mediaUrl(key);
  }
  const cfg = s3Config();
  if (!cfg) throw new Error('No file storage is configured');
  const { client, PutObjectCommand } = await s3Client(cfg);
  await client.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }));
  return `${cfg.publicBase}/${key}`;
}

/** Stores a private file (customer attachments). Only readable through /uploads, which checks the session. */
export async function putPrivateFile(name: string, body: Uint8Array, contentType: string, downloadName: string): Promise<boolean> {
  const b = await buckets();
  if (!b) return false;
  await b.private.put(`attachments/${name}`, body, {
    httpMetadata: { contentType, contentDisposition: `inline; filename="${downloadName.replace(/["\\]/g, '')}"` },
  });
  return true;
}

export async function getPrivateFile(name: string): Promise<R2Object | null> {
  const b = await buckets();
  return b ? b.private.get(`attachments/${name}`) : null;
}

export async function getPublicMedia(key: string): Promise<R2Object | null> {
  const b = await buckets();
  return b ? b.media.get(key) : null;
}
