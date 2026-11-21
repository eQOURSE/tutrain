import { z } from 'zod';

export class EnvironmentValidationError extends Error {
  readonly variableNames: string[];

  constructor(variableNames: string[]) {
    const names = [...new Set(variableNames)].sort();
    super(`Invalid environment variables: ${names.join(', ')}`);
    this.name = 'EnvironmentValidationError';
    this.variableNames = names;
  }
}

export function parseEnv<T>(schema: z.ZodType<T>, source: Record<string, string | undefined>): T {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const names = result.error.issues.map((issue) => {
    const [name] = issue.path;
    return typeof name === 'string' ? name : 'ENVIRONMENT';
  });
  throw new EnvironmentValidationError(names);
}
