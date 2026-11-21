import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  catalogProductResponseSchema,
  catalogResponseSchema,
  quoteRequestSchema,
  quoteResponseSchema,
  taxonomyResponseSchema,
} from '../catalog/index.js';
import {
  logoutRequestSchema,
  meResponseSchema,
  otpSendRequestSchema,
  otpSendResponseSchema,
  otpVerifyRequestSchema,
  otpVerifyResponseSchema,
  refreshResponseSchema,
} from '../iam/index.js';
import { problemDetailsSchema } from '../shared/index.js';

const fixturesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type Schema = { parse: (value: unknown) => unknown; safeParse: (value: unknown) => { success: boolean } };

type FixtureEntry = {
  request?: Schema;
  response: Record<number, Schema>;
};

const fixtureTable: Record<string, FixtureEntry> = {
  'iam/fixtures/otp-send.success.json': { request: otpSendRequestSchema, response: { 200: otpSendResponseSchema } },
  'iam/fixtures/otp-verify.error-locked.json': { request: otpVerifyRequestSchema, response: { 429: problemDetailsSchema } },
  'iam/fixtures/otp-verify.success-new-guardian.json': { request: otpVerifyRequestSchema, response: { 200: otpVerifyResponseSchema } },
  'iam/fixtures/refresh.error-reused-token.json': { response: { 401: problemDetailsSchema } },
  'iam/fixtures/refresh.success.json': { response: { 200: refreshResponseSchema } },
  'iam/fixtures/logout.success.json': { request: logoutRequestSchema, response: {} },
  'iam/fixtures/me.guardian-two-learners.json': { response: { 200: meResponseSchema } },
  'iam/fixtures/me.learner.json': { response: { 200: meResponseSchema } },
  'iam/fixtures/me.staff.json': { response: { 200: meResponseSchema } },
  'iam/fixtures/me.tutor.json': { response: { 200: meResponseSchema } },
  'catalog/fixtures/catalog-AE.success.json': { response: { 200: catalogResponseSchema } },
  'catalog/fixtures/catalog-IN.success.json': { response: { 200: catalogResponseSchema } },
  'catalog/fixtures/product.success.json': { response: { 200: catalogProductResponseSchema } },
  'catalog/fixtures/taxonomy-board.success.json': { response: { 200: taxonomyResponseSchema } },
  'catalog/fixtures/quote.error-promo-expired.json': { request: quoteRequestSchema, response: { 422: problemDetailsSchema } },
  'catalog/fixtures/quote.error-promo-limit.json': { request: quoteRequestSchema, response: { 422: problemDetailsSchema } },
  'catalog/fixtures/quote.success-promo-gst.json': { request: quoteRequestSchema, response: { 200: quoteResponseSchema } },
  'shared/fixtures/resource.error-not-found.json': { response: { 404: problemDetailsSchema } },
  'shared/fixtures/validation.error-unprocessable.json': { response: { 422: problemDetailsSchema } },
};

function fixtureFiles(directory: string, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) return fixtureFiles(path.join(directory, entry.name), relative);
    return entry.isFile() && entry.name.endsWith('.json') ? [relative.replaceAll(path.sep, '/')] : [];
  });
}

function contractFixtureFiles(): string[] {
  return readdirSync(fixturesRoot, { withFileTypes: true }).flatMap((module) => {
    if (!module.isDirectory()) return [];
    const directory = path.join(fixturesRoot, module.name, 'fixtures');
    return existsSync(directory) ? fixtureFiles(directory, `${module.name}/fixtures`) : [];
  });
}

function readFixture(relativePath: string): {
  request: { body?: unknown };
  response: { status: number; body?: unknown };
} {
  return JSON.parse(readFileSync(path.join(fixturesRoot, relativePath), 'utf8')) as {
    request: { body?: unknown };
    response: { status: number; body?: unknown };
  };
}

describe('contract fixtures', () => {
  it('[NFR-MNT-03] maps every fixture file to request and status response schemas', () => {
    expect(Object.keys(fixtureTable).sort()).toEqual(contractFixtureFiles().sort());
  });

  it('[NFR-MNT-03] has an existing fixture for every table entry', () => {
    for (const relativePath of Object.keys(fixtureTable)) {
      expect(() => readFixture(relativePath), relativePath).not.toThrow();
    }
  });

  it('[NFR-MNT-03] parses every fixture request and response with its contract', () => {
    for (const [relativePath, entry] of Object.entries(fixtureTable)) {
      const fixture = readFixture(relativePath);
      if (entry.request && fixture.request.body !== undefined) entry.request.parse(fixture.request.body);
      const responseSchema = entry.response[fixture.response.status];
      if (fixture.response.body !== undefined) expect(responseSchema, relativePath).toBeDefined();
      if (responseSchema && fixture.response.body !== undefined) responseSchema.parse(fixture.response.body);
    }
  });

  it('[NFR-MNT-03] rejects unknown fields in strict request and response objects', () => {
    const otpSend = readFixture('iam/fixtures/otp-send.success.json').request.body as Record<string, unknown>;
    const me = readFixture('iam/fixtures/me.learner.json').response.body as Record<string, unknown>;
    expect(otpSendRequestSchema.safeParse({ ...otpSend, unexpected: true }).success).toBe(false);
    expect(meResponseSchema.safeParse({ ...me, unexpected: true }).success).toBe(false);
  });

  it('[NFR-MNT-03] rejects non-integer and formatted-string money amounts', () => {
    const quote = readFixture('catalog/fixtures/quote.success-promo-gst.json').response.body as Record<string, unknown>;
    const total = quote.total as Record<string, unknown>;
    expect(quoteResponseSchema.safeParse({ ...quote, total: { ...total, amount_minor: 249.9 } }).success).toBe(false);
    expect(quoteResponseSchema.safeParse({ ...quote, total: { ...total, amount_minor: '2499.00' } }).success).toBe(false);
  });

  it('[NFR-MNT-03] rejects Problem Details with a non-numeric status', () => {
    const problem = readFixture('shared/fixtures/resource.error-not-found.json').response.body as Record<string, unknown>;
    expect(problemDetailsSchema.safeParse({ ...problem, status: '404' }).success).toBe(false);
  });
});
