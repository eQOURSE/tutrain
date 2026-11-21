import { Router, type Request } from 'express';
import type { Logger } from 'pino';
import { healthReadyResponseSchema, problemDetailsSchema } from '@tutrain/contracts/shared';

type ReadinessResult =
  | { ok: true }
  | { ok: false; error_name: string; error_code?: string };
type RequestWithId = Request & { requestId?: string };

function requestId(request: Request): string {
  return (request as RequestWithId).requestId ?? 'unknown';
}

function errorResult(error: unknown): ReadinessResult {
  if (!error || typeof error !== 'object') return { ok: false, error_name: 'UnknownError' };
  const errorCode = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  return {
    ok: false,
    error_name: error instanceof Error ? error.name : 'UnknownError',
    ...(errorCode ? { error_code: errorCode } : {}),
  };
}

export type HealthRouterOptions = { logger: Logger; checkReadiness: () => Promise<ReadinessResult> };

export function healthRouter(options: HealthRouterOptions): Router {
  const router = Router();

  router.get('/v1/health/live', (_request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.json({ status: 'ok' });
  });

  router.get('/v1/health/ready', async (request, response) => {
    let result: ReadinessResult;
    try {
      result = await options.checkReadiness();
    } catch (error) {
      result = errorResult(error);
    }

    response.setHeader('Cache-Control', 'no-store');
    if (result.ok) {
      response.json(healthReadyResponseSchema.parse({ status: 'ok', checks: { database: 'up' } }));
      return;
    }

    options.logger.warn(
      {
        request_id: requestId(request),
        error_name: result.error_name,
        ...(result.error_code ? { error_code: result.error_code } : {}),
      },
      'readiness_failed',
    );
    response
      .status(503)
      .type('application/problem+json')
      .send(
        problemDetailsSchema.parse({
          type: 'https://docs.tutrain.com/errors/not-ready',
          title: 'Service not ready',
          status: 503,
          code: 'NOT_READY',
          detail: 'The service is not ready.',
          request_id: requestId(request),
          errors: [{ path: 'database', message: 'unavailable' }],
        }),
      );
  });

  return router;
}
