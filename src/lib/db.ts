// The database: Cloudflare D1 (SQLite).
//
// On Workers, and under `next dev` (where the Cloudflare adapter supplies a
// local D1), queries go to the DB binding from wrangler.jsonc. Anywhere else
// (tests, scripts) they go to Node's built-in SQLite on a file, created from
// db/schema.sql + db/seed.sql the first time it is opened. Same SQL, same API.
//
// SQL is written in SQLite's dialect with Postgres-style `$1` placeholders,
// which are rewritten to `?1` here. Values are coerced to what SQLite stores
// (booleans to 0/1, Dates to ISO text, objects to JSON) and a few columns are
// turned back into their JS types on the way out (see BOOLEAN_COLUMNS and
// JSON_COLUMNS). Timestamps are ISO 8601 UTC text; use NOW in SQL for the
// current time so every stored value has the same shape and sorts correctly.

export type Row = Record<string, unknown>;
export type Statement = { sql: string; params?: unknown[] };

/** SQL expression for the current time, in the same format every timestamp column uses. */
export const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

/** SQL expression for the current time plus a SQLite modifier such as '-30 days'. */
export const nowPlus = (modifier: string) => `strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '${modifier}')`;

const BOOLEAN_COLUMNS = new Set(['featured', 'revoked', 'overdue']);
const JSON_COLUMNS = new Set(['attachments', 'configuration_json', 'wood_swatches']);

// --------------------------------------------------------------- backends

type D1Result = { results?: Row[]; meta?: { changes?: number } };
type D1Prepared = { bind(...p: unknown[]): D1Prepared; all(): Promise<D1Result>; run(): Promise<D1Result> };
type D1Database = { prepare(sql: string): D1Prepared; batch(stmts: D1Prepared[]): Promise<D1Result[]> };

interface Backend {
  all(sql: string, params: unknown[]): Promise<Row[]>;
  run(sql: string, params: unknown[]): Promise<number>;
  batch(stmts: Statement[]): Promise<void>;
}

function d1Backend(db: D1Database): Backend {
  const prep = (s: Statement) => db.prepare(toSqlite(s.sql)).bind(...(s.params ?? []).map(toParam));
  return {
    async all(sql, params) {
      return ((await prep({ sql, params }).all()).results ?? []).map(fromRow);
    },
    async run(sql, params) {
      return (await prep({ sql, params }).run()).meta?.changes ?? 0;
    },
    async batch(stmts) {
      if (stmts.length) await db.batch(stmts.map(prep));
    },
  };
}

// Node's SQLite, for tests and scripts. Loaded lazily so the Worker bundle
// never references it.
let nodeBackend: Backend | null = null;
async function sqliteBackend(): Promise<Backend> {
  if (nodeBackend) return nodeBackend;
  const [{ DatabaseSync }, fs, path] = await Promise.all([import('node:sqlite'), import('node:fs'), import('node:path')]);
  const file = process.env.SQLITE_PATH ?? path.join(process.cwd(), '.data', 'local.sqlite');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('pragma foreign_keys = on');
  const hasTables = db.prepare("select 1 from sqlite_master where type = 'table' and name = 'users'").get();
  if (!hasTables) {
    const root = path.join(process.cwd(), 'db');
    db.exec(fs.readFileSync(path.join(root, 'schema.sql'), 'utf8'));
    db.exec(fs.readFileSync(path.join(root, 'seed.sql'), 'utf8'));
  }
  nodeBackend = {
    async all(sql, params) {
      return (db.prepare(toSqlite(sql)).all(...(params.map(toParam) as never[])) as Row[]).map(fromRow);
    },
    async run(sql, params) {
      return Number(db.prepare(toSqlite(sql)).run(...(params.map(toParam) as never[])).changes);
    },
    async batch(stmts) {
      db.exec('begin');
      try {
        for (const s of stmts) db.prepare(toSqlite(s.sql)).run(...((s.params ?? []).map(toParam) as never[]));
        db.exec('commit');
      } catch (e) {
        db.exec('rollback');
        throw e;
      }
    },
  };
  return nodeBackend;
}

const onWorkers = typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

async function backend(): Promise<Backend> {
  // The D1 binding exists on Workers, and in `next dev` through the adapter's
  // dev shim. `next build` and vitest have neither and use Node's SQLite.
  if (onWorkers || (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'development')) {
    try {
      const { getCloudflareContext } = await import('@opennextjs/cloudflare');
      const env = (await getCloudflareContext({ async: true })).env as { DB?: D1Database };
      if (env.DB) return d1Backend(env.DB);
    } catch {
      // no Cloudflare context here
    }
    if (onWorkers) throw new Error('No DB binding: check d1_databases in wrangler.jsonc');
  }
  return sqliteBackend();
}

// ------------------------------------------------------------- conversions

/** `$1` placeholders become SQLite's `?1`. */
function toSqlite(sql: string): string {
  return sql.replace(/\$(\d+)/g, '?$1');
}

function toParam(v: unknown): unknown {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  return v;
}

function fromRow(row: Row): Row {
  for (const k of Object.keys(row)) {
    const v = row[k];
    if (BOOLEAN_COLUMNS.has(k) && (v === 0 || v === 1)) row[k] = v === 1;
    else if (JSON_COLUMNS.has(k) && typeof v === 'string') {
      try { row[k] = JSON.parse(v); } catch { /* leave the text alone */ }
    }
  }
  return row;
}

// --------------------------------------------------------------------- API

export async function query<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await backend()).all(sql, params) as Promise<T[]>;
}

export async function queryOne<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Runs a statement and returns how many rows it changed. */
export async function run(sql: string, params: unknown[] = []): Promise<number> {
  return (await backend()).run(sql, params);
}

/**
 * Runs several statements as one atomic unit: all of them apply, or none.
 * D1 has no open transactions, so anything that needs reading first reads,
 * decides, then hands the writes to batch().
 */
export async function batch(stmts: Statement[]): Promise<void> {
  return (await backend()).batch(stmts);
}

/** A new id for a row that will be referenced by other rows in the same batch. */
export function newId(): string {
  return crypto.randomUUID();
}

/** True when an error is SQLite refusing a duplicate on a unique column. */
export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Error && /UNIQUE constraint failed/i.test(e.message);
}
