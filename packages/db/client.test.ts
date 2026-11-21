import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { checkDatabase, createPool } from './client.js';

const postgresImage =
  'postgres:16.16-alpine@sha256:1d5b02d3a9941fbd52437db4107f8c52d6297dac553ca1e5c299ebb3756b4857';

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

describe('PostgreSQL client', () => {
  let container: StartedPostgreSqlContainer;
  let pool: ReturnType<typeof createPool>;
  let containerStopped = false;

  beforeAll(async () => {
    container = await new PostgreSqlContainer(postgresImage)
      .withDatabase('tutrain')
      .withUsername('tutrain')
      .withPassword('tutrain')
      .start();
    pool = createPool(container.getConnectionUri(), { onError: () => undefined });
  });

  afterAll(async () => {
    await pool.end();
    if (!containerStopped) await container.stop();
  });

  it('[SPECS §1 AC1] checkDatabase reports PostgreSQL 16 as up', async () => {
    const result = await checkDatabase(pool);
    expect(result).toEqual({ ok: true });
    const version = await pool.query<{ server_version: string }>('SHOW server_version');
    expect(version.rows[0]?.server_version).toMatch(/^16\./u);
  });

  it('[SPECS §1] checkDatabase reports a stopped database as down within its timeout', async () => {
    await container.stop();
    containerStopped = true;
    const started = performance.now();
    const result = await checkDatabase(pool, 2_000);
    expect(performance.now() - started).toBeLessThan(3_000);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain(container.getConnectionUri());
    expect(JSON.stringify(result)).not.toContain('tutrain');
  });
});
