import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseEnv } from '../env.js';

describe('environment parsing', () => {
  it('[SPECS §1] parses a valid environment without exposing values in errors', () => {
    const schema = z.strictObject({
      NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
      PORT: z.coerce.number().int().min(1).max(65535),
    });

    expect(parseEnv(schema, { NODE_ENV: 'test', PORT: '3100' })).toEqual({ NODE_ENV: 'test', PORT: 3100 });
  });

  it('[SPECS §1] reports invalid environment variable names without their values', () => {
    const schema = z.strictObject({
      NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
      PORT: z.coerce.number().int().min(1).max(65535),
    });

    expect(() => parseEnv(schema, { NODE_ENV: 'invalid-environment', PORT: '70000' })).toThrowError(
      /NODE_ENV.*PORT/u,
    );
    expect(() => parseEnv(schema, { NODE_ENV: 'invalid-environment', PORT: '70000' })).toThrowError(
      (error: Error) => !error.message.includes('invalid-environment') && !error.message.includes('70000'),
    );
  });
});
