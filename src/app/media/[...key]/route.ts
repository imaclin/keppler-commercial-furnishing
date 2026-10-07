import { getPublicMedia } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// Public media (product photos, 360 frames, admin uploads) straight from the
// MEDIA bucket. Every key is content-addressed, so responses are immutable and
// the edge cache keeps them close to visitors after the first request.
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segs } = await params;
  const key = segs.map(decodeURIComponent).join('/');
  if (segs.some((s) => s === '..' || s === '.' || s === '')) return new Response('Not found', { status: 404 });

  // Workers expose the edge cache as caches.default; Node's CacheStorage has no such member.
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  const cacheKey = new Request(new URL(req.url).toString(), { method: 'GET' });
  const hit = await cache?.match(cacheKey);
  if (hit) return hit;

  const obj = await getPublicMedia(key);
  if (!obj || !obj.body) return new Response('Not found', { status: 404 });
  const res = new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': obj.httpMetadata?.cacheControl ?? 'public, max-age=31536000, immutable',
      ETag: obj.httpEtag,
    },
  });
  if (cache) {
    const ctx = await workerContext();
    const store = cache.put(cacheKey, res.clone());
    ctx ? ctx.waitUntil(store) : await store;
  }
  return res;
}

async function workerContext(): Promise<{ waitUntil(p: Promise<unknown>): void } | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    return (await getCloudflareContext({ async: true })).ctx;
  } catch {
    return null;
  }
}
