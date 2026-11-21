import pino, { type DestinationStream, type Logger } from 'pino';

const sensitiveKeys = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'otp',
  'phone',
  'email',
  'destination',
  'address',
];

const redactPaths = [
  'authorization',
  'cookie',
  'set-cookie',
  'headers.authorization',
  'headers.cookie',
  'headers.set-cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  ...sensitiveKeys,
  ...sensitiveKeys.map((key) => `*.${key}`),
];

export function createLogger(destination?: DestinationStream, level = 'info'): Logger {
  return pino(
    {
      level,
      redact: { paths: redactPaths, censor: '[REDACTED]' },
    },
    destination,
  );
}
