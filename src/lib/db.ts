import { Pool, type QueryResultRow, type PoolClient } from 'pg';

// One Postgres pool per process on Node (local dev, tests). On Cloudflare
// Workers a connection opened during one request cannot be used by another,
// so there the pool lives for one request: it is keyed on that request's
// execution context and closed once the response has gone out.

const globalForPg = globalThis as unknown as { pgPool?: Pool };

function newPool(): Pool {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

type Ctx = { waitUntil(p: Promise<unknown>): void };
const perRequest = new WeakMap<object, Pool>();

// True only inside the deployed Worker. `next build` and `next dev` run on Node
// even with the Cloudflare adapter's dev shim loaded, and there one shared pool
// is right (the shim hands every page the same context, so a per-context pool
// would be closed after the first page).
const onWorkers = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

async function requestContext(): Promise<Ctx | null> {
  if (!onWorkers) return null;
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  return (await getCloudflareContext({ async: true })).ctx as Ctx;
}

// On Workers nothing tells app code when a response has finished rendering, so
// a request's pool is not closed at a fixed moment. Its connections close
// themselves once idle for a short while, and the pool is ended (in the
// background, after the response) once every connection has gone, so a late
// query during rendering is never cut off.
const WORKER_IDLE_MS = 400;
const WORKER_DRAIN_CAP_MS = 20_000;

async function getPool(): Promise<Pool> {
  const ctx = await requestContext();
  if (!ctx) {
    globalForPg.pgPool ??= newPool();
    return globalForPg.pgPool;
  }
  let pool = perRequest.get(ctx);
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, idleTimeoutMillis: WORKER_IDLE_MS, max: 4 });
    // An idle connection the runtime closes under us is not an app error.
    pool.on('error', () => {});
    perRequest.set(ctx, pool);
    const p = pool;
    ctx.waitUntil(
      new Promise<void>((resolve) => {
        const started = Date.now();
        const tick = () => {
          if (p.totalCount === 0 || Date.now() - started > WORKER_DRAIN_CAP_MS) {
            p.end().catch(() => {}).finally(resolve);
          } else {
            setTimeout(tick, 100);
          }
        };
        setTimeout(tick, WORKER_IDLE_MS);
      }),
    );
  }
  return pool;
}

/** Closes the process-wide pool. Tests call this so vitest can exit. */
export async function closePool(): Promise<void> {
  const pool = globalForPg.pgPool;
  globalForPg.pgPool = undefined;
  await pool?.end();
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await (await getPool()).query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await (await getPool()).connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
