import { z } from 'zod';

export const idSchema = z.string().min(1);
export type Id = z.infer<typeof idSchema>;

export const timestampSchema = z.iso.datetime();
export type Timestamp = z.infer<typeof timestampSchema>;

export const moneySchema = z.strictObject({
  amount_minor: z.number().int(),
  currency: z.string().regex(/^[A-Z]{3}$/u),
});
export type Money = z.infer<typeof moneySchema>;

export const problemDetailsSchema = z.strictObject({
  type: z.url(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  code: z.string().regex(/^[A-Z][A-Z0-9_]*$/u),
  detail: z.string(),
  request_id: idSchema,
  errors: z.array(z.strictObject({ path: z.string(), message: z.string() })).optional(),
});
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

export const healthLiveResponseSchema = z.strictObject({ status: z.literal('ok') });
export type HealthLiveResponse = z.infer<typeof healthLiveResponseSchema>;

export function cursorPageSchema<T extends z.ZodType>(itemSchema: T) {
  return z.strictObject({ data: z.array(itemSchema), next_cursor: z.string().nullable() });
}
export type CursorPage<T> = { data: T[]; next_cursor: string | null };
