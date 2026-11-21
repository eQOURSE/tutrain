import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import express, { type ErrorRequestHandler, type Express, type Request } from 'express';
import type { Logger } from 'pino';
import { problemDetailsSchema } from '@tutrain/contracts/shared';
import { createLogger } from './logger.js';
import { healthRouter } from './platform/health.routes.js';

export class HttpProblem extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly detail: string;

  constructor(status: number, code: string, title: string, detail: string) {
    super(detail);
    this.name = 'HttpProblem';
    this.status = status;
    this.code = code;
    this.title = title;
    this.detail = detail;
  }
}

export type AppOptions = { logger?: Logger; registerRoutes?: (app: Express) => void };
type RequestWithId = Request & { requestId: string };

function requestId(request: Request): string {
  return (request as RequestWithId).requestId;
}

function isParserError(error: unknown, type: string): boolean {
  return Boolean(error && typeof error === 'object' && 'type' in error && error.type === type);
}

function problemType(code: string): string {
  return `https://docs.tutrain.com/errors/${code.toLowerCase().replaceAll('_', '-')}`;
}

function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, request, response, next) => {
    void next;
    let problem: HttpProblem;
    if (isParserError(error, 'entity.parse.failed')) {
      problem = new HttpProblem(400, 'MALFORMED_JSON', 'Malformed JSON', 'The request body is not valid JSON.');
    } else if (isParserError(error, 'entity.too.large')) {
      problem = new HttpProblem(413, 'PAYLOAD_TOO_LARGE', 'Payload too large', 'The request body exceeds 100 kB.');
    } else if (error instanceof HttpProblem) {
      problem = error;
    } else {
      const unknownError = error instanceof Error ? error : new Error('Unknown error');
      logger.error({ request_id: requestId(request), err: unknownError }, 'unhandled request error');
      problem = new HttpProblem(500, 'INTERNAL_ERROR', 'Internal server error', 'An internal server error occurred.');
    }

    const body = problemDetailsSchema.parse({
      type: problemType(problem.code),
      title: problem.title,
      status: problem.status,
      code: problem.code,
      detail: problem.detail,
      request_id: requestId(request),
    });
    response.status(problem.status).type('application/problem+json').send(body);
  };
}

export function createApp(options: AppOptions = {}): Express {
  const logger = options.logger ?? createLogger(undefined, 'silent');
  const app = express();
  app.disable('x-powered-by');

  app.use((request, response, next) => {
    const requestWithId = request as RequestWithId;
    requestWithId.requestId = randomUUID();
    response.setHeader('X-Request-Id', requestWithId.requestId);
    const startedAt = performance.now();
    response.on('finish', () => {
      logger.info(
        {
          request_id: requestWithId.requestId,
          method: request.method,
          path: request.path,
          status: response.statusCode,
          duration_ms: Math.round(performance.now() - startedAt),
        },
        'request completed',
      );
    });
    next();
  });

  app.use(express.json({ limit: '100kb' }));
  app.use(healthRouter);
  options.registerRoutes?.(app);
  app.use((_request, _response, next) => {
    next(new HttpProblem(404, 'NOT_FOUND', 'Not found', 'The requested resource was not found.'));
  });
  app.use(errorHandler(logger));
  return app;
}

export function shutdownServer(server: Server, timeoutMs = 10_000): Promise<void> {
  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(() => {
      server.closeAllConnections();
      finish();
    }, timeoutMs);
    try {
      server.close(() => finish());
      server.closeIdleConnections();
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ERR_SERVER_NOT_RUNNING') finish();
      else throw error;
    }
  });
}
