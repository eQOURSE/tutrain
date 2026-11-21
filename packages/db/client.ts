import { Pool } from 'pg';

export type DatabaseCheckResult =
  | { ok: true }
  | { ok: false; error_name: string; error_code?: string };

export type PoolOptions = { onError: (error: unknown) => void };

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

export function createPool(databaseUrl: string, options: PoolOptions): Pool {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    connectionTimeoutMillis: 2_000,
  });
  pool.on('error', options.onError);
  return pool;
}

export function checkDatabase(pool: Pick<Pool, 'query'>, timeoutMs = 2_000): Promise<DatabaseCheckResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: DatabaseCheckResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };
    const timeout = setTimeout(
      () => finish({ ok: false, error_name: 'TimeoutError', error_code: 'DB_CHECK_TIMEOUT' }),
      timeoutMs,
    );

    pool
      .query('SELECT 1')
      .then(() => finish({ ok: true }))
      .catch((error: unknown) => {
        const code = errorCode(error);
        finish({ ok: false, error_name: errorName(error), ...(code ? { error_code: code } : {}) });
      });
  });
}
