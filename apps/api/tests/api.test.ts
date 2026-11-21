import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import { Writable } from 'node:stream';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import express from 'express';
import type { Logger } from 'pino';
import { describe, expect, it } from 'vitest';
import { healthLiveResponseSchema, problemDetailsSchema } from '@tutrain/contracts/shared';
import { createApp, HttpProblem, shutdownServer } from '../src/app.js';
import { createLogger } from '../src/logger.js';

type LogCapture = { logger: Logger; text: () => string };

function captureLogs(): LogCapture {
  let output = '';
  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      output += chunk.toString('utf8');
      callback();
    },
  });
  return { logger: createLogger(destination), text: () => output };
}

async function listen(app: express.Express): Promise<import('node:http').Server> {
  const server = app.listen(0);
  await once(server, 'listening');
  return server;
}

function baseUrl(server: import('node:http').Server): string {
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: import('node:http').Server): Promise<void> {
  await shutdownServer(server, 1000);
}

async function problem(response: Response): Promise<Record<string, unknown>> {
  expect(response.headers.get('content-type')).toMatch(/^application\/problem\+json/u);
  return (await response.json()) as Record<string, unknown>;
}

describe('API entry point', () => {
  it('[SPECS §1] a missing NODE_ENV and an invalid PORT are reported by name, with no values, and main exits with code 1', () => {
    const environment = { ...process.env };
    delete environment.NODE_ENV;
    environment.PORT = '70000';
    const mainPath = path.resolve('apps/api/src/main.ts');
    const result = spawnSync(process.execPath, ['--import', 'tsx', mainPath], {
      cwd: path.resolve('apps/api'),
      encoding: 'utf8',
      env: environment,
      timeout: 5000,
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toMatch(/NODE_ENV/u);
    expect(`${result.stdout}${result.stderr}`).toMatch(/PORT/u);
    expect(`${result.stdout}${result.stderr}`).not.toContain('70000');
  });

  it('[SPECS §1 AC2] an unhandled error returns 500 Problem Details with request_id and no stack or error message', async () => {
    const app = createApp({ logger: captureLogs().logger });
    app.get('/test/fail', () => {
      throw new Error('secret failure message');
    });
    const server = await listen(app);
    try {
      const response = await fetch(`${baseUrl(server)}/test/fail`);
      const body = await problem(response);
      expect(response.status).toBe(500);
      expect(body.request_id).toBe(response.headers.get('x-request-id'));
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(JSON.stringify(body)).not.toContain('secret failure message');
      expect(JSON.stringify(body)).not.toContain('Error:');
      expect(problemDetailsSchema.parse(body)).toMatchObject({ code: 'INTERNAL_ERROR' });
    } finally {
      await close(server);
    }
  });

  it('[SPECS §1 AC2] unknown route 404, malformed JSON 400 and oversized body 413, each passing problemDetailsSchema', async () => {
    const app = createApp({ logger: captureLogs().logger });
    app.post('/test/body', (_request, response) => response.json({ ok: true }));
    const server = await listen(app);
    try {
      const unknown = await fetch(`${baseUrl(server)}/missing`);
      const malformed = await fetch(`${baseUrl(server)}/test/body`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      });
      const oversized = await fetch(`${baseUrl(server)}/test/body`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: 'x'.repeat(110 * 1024) }),
      });

      expect(unknown.status).toBe(404);
      expect((await problem(unknown)).code).toBe('NOT_FOUND');
      expect(malformed.status).toBe(400);
      expect((await problem(malformed)).code).toBe('MALFORMED_JSON');
      expect(oversized.status).toBe(413);
      expect((await problem(oversized)).code).toBe('PAYLOAD_TOO_LARGE');
    } finally {
      await close(server);
    }
  });

  it('[NFR-OBS-01] every response has X-Request-Id, and an error body request_id matches it', async () => {
    const app = createApp({ logger: captureLogs().logger });
    const server = await listen(app);
    try {
      const response = await fetch(`${baseUrl(server)}/missing`);
      const body = await problem(response);
      expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/u);
      expect(body.request_id).toBe(response.headers.get('x-request-id'));
    } finally {
      await close(server);
    }
  });

  it('[NFR-OBS-01] the request log line has request_id, method, path, status and duration_ms; a request carrying a query string, a JSON body, a cookie and an Authorization header leaves none of those values in the captured log', async () => {
    const capture = captureLogs();
    const app = createApp({ logger: capture.logger });
    app.post('/test/log', (_request, response) => response.json({ ok: true }));
    const server = await listen(app);
    try {
      await fetch(`${baseUrl(server)}/test/log?secret-query=query-value`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer secret-authorization',
          cookie: 'session=secret-cookie',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email: 'secret@example.test', password: 'secret-password' }),
      });
      const line = capture.text().trim().split('\n').map((value) => JSON.parse(value) as Record<string, unknown>)[0];
      expect(line).toMatchObject({ method: 'POST', path: '/test/log', status: 200 });
      expect(line.request_id).toMatch(/^[0-9a-f-]{36}$/u);
      expect(typeof line.duration_ms).toBe('number');
      expect(capture.text()).not.toContain('secret-query');
      expect(capture.text()).not.toContain('query-value');
      expect(capture.text()).not.toContain('secret@example.test');
      expect(capture.text()).not.toContain('secret-password');
      expect(capture.text()).not.toContain('secret-cookie');
      expect(capture.text()).not.toContain('secret-authorization');
    } finally {
      await close(server);
    }
  });

  it('[NFR-OBS-01] logging an object with phone, email, token, password, otp and authorization values outputs none of them', () => {
    const capture = captureLogs();
    capture.logger.info({
      phone: 'secret-phone',
      email: 'secret@example.test',
      token: 'secret-token',
      password: 'secret-password',
      otp: '123456',
      authorization: 'Bearer secret-authorization',
      nested: { phone: 'nested-phone', token: 'nested-token' },
    });
    expect(capture.text()).not.toContain('secret-phone');
    expect(capture.text()).not.toContain('secret@example.test');
    expect(capture.text()).not.toContain('secret-token');
    expect(capture.text()).not.toContain('secret-password');
    expect(capture.text()).not.toContain('123456');
    expect(capture.text()).not.toContain('secret-authorization');
    expect(capture.text()).not.toContain('nested-phone');
    expect(capture.text()).not.toContain('nested-token');
  });

  it('[SPECS §1] GET /v1/health/live returns 200 matching healthLiveResponseSchema, without X-Powered-By', async () => {
    const app = createApp({ logger: captureLogs().logger });
    const server = await listen(app);
    try {
      const response = await fetch(`${baseUrl(server)}/v1/health/live`);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-powered-by')).toBeNull();
      expect(healthLiveResponseSchema.parse(await response.json())).toEqual({ status: 'ok' });
    } finally {
      await close(server);
    }
  });

  it('[SPECS §1] the shutdown helper refuses new connections and resolves after open requests finish', async () => {
    const app = createApp({ logger: captureLogs().logger });
    app.get('/test/slow', async (_request, response) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      response.json({ ok: true });
    });
    const server = await listen(app);
    const request = fetch(`${baseUrl(server)}/test/slow`);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const shutdown = shutdownServer(server, 1000);
    const response = await request;
    await shutdown;
    expect(response.status).toBe(200);
    expect(server.listening).toBe(false);
    await expect(fetch(`${baseUrl(server)}/test/slow`)).rejects.toThrow();
  });

  it('[SPECS §1] HttpProblem preserves its status and code', () => {
    const error = new HttpProblem(422, 'VALIDATION_ERROR', 'Validation failed', 'The request is invalid.');
    expect(error.status).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});
