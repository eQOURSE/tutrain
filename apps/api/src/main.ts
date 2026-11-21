import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp, shutdownServer } from './app.js';
import { parseApiEnv } from './env.js';
import { createLogger } from './logger.js';

function loadLocalEnv(): void {
  const localEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  if (process.env.NODE_ENV !== 'production' && existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);
}

async function start(): Promise<void> {
  try {
    loadLocalEnv();
    const env = parseApiEnv();
    const logger = createLogger(process.stdout, env.LOG_LEVEL);
    const app = createApp({ logger });
    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, 'API listening');
    });
    const stop = () => {
      void shutdownServer(server).then(() => process.exit(0));
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
