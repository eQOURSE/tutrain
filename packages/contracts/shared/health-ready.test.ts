import { describe, expect, it } from 'vitest';
import { healthReadyResponseSchema } from './index.js';

describe('health readiness contract', () => {
  it('[SPECS §1] accepts the database-ready response', () => {
    expect(healthReadyResponseSchema.parse({ status: 'ok', checks: { database: 'up' } })).toEqual({
      status: 'ok',
      checks: { database: 'up' },
    });
  });
});
