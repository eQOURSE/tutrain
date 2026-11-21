import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/v1/health/live', (_request, response) => {
  response.json({ status: 'ok' });
});
