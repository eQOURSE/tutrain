import { createApp, shutdownServer } from './app.js';
import { parseApiEnv } from './env.js';
import { createLogger } from './logger.js';
import { checkDatabase, createPool } from '@tutrain/db/client';

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

async function start(): Promise<void> {
  try {
    const env = parseApiEnv();
    const logger = createLogger(process.stdout, env.LOG_LEVEL);
    const pool = createPool(env.DATABASE_URL, {
      onError: (error) => {
        const code = errorCode(error);
        logger.error({ error_name: errorName(error), ...(code ? { error_code: code } : {}) }, 'database_pool_error');
      },
    });
    const app = createApp({ logger, checkReadiness: () => checkDatabase(pool) });
    const server = app.listen(env.PORT, (error?: Error) => {
      if (error) {
        logger.fatal({ error_name: error.name, error_code: errorCode(error) }, 'API failed to listen');
        process.exit(1);
        return;
      }
      logger.info({ port: env.PORT }, 'API listening');
    });
    server.once('error', (error: Error) => {
      logger.fatal({ error_name: error.name, error_code: errorCode(error) }, 'API failed to listen');
      process.exit(1);
    });
    const stop = () => {
      void shutdownServer(server)
        .then(() => pool.end())
        .then(() => process.exit(0));
    };
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid environment variables: ENVIRONMENT';
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

void start();
