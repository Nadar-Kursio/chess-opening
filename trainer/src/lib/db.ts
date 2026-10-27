import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool, types, type PoolClient, type QueryResultRow } from 'pg';

// Practice days are calendar days; keep them as 'YYYY-MM-DD' instead of shifting through Date.
types.setTypeParser(types.builtins.DATE, (value) => value);

function createPool() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is not set');
  // pg turns any ssl* query parameter into its own ssl settings, which would drop the CA below.
  const url = new URL(raw);
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('ssl')) url.searchParams.delete(key);
  }
  // Production lives on the shared Kursio RDS instance and is verified against the AWS RDS CA
  // bundle committed beside package.json; the local Docker database needs no TLS.
  const isRds = url.hostname.endsWith('.rds.amazonaws.com');
  const pool = new Pool({
    connectionString: url.toString(),
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: isRds
      ? { ca: readFileSync(path.join(process.cwd(), 'global-bundle.pem'), 'utf8') }
      : undefined,
  });
  // An idle client dropped by the server would otherwise surface as an uncaught error.
  pool.on('error', (err) => console.error('[db] pool error', err.message));
  return pool;
}

const globalForPool = globalThis as unknown as { chesslabPool?: Pool };

// Reused across dev hot reloads so each edit doesn't open a fresh pool.
export const pool = globalForPool.chesslabPool ?? createPool();
globalForPool.chesslabPool = pool;

export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
  const { rows } = await pool.query<T>(sql, params);
  return rows;
}

export async function queryOne<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Runs `work` in a transaction, rolling back if it throws. */
export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
