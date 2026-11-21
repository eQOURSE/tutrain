import { z } from 'zod';
import { cursorPageSchema, idSchema, moneySchema } from '../shared/index.js';

const catalogItemSchema = z.strictObject({
  id: idSchema,
  slug: z.string().min(1),
  name: z.string(),
  market: z.string().min(1),
  price: moneySchema,
  tax_included: z.boolean(),
});

export const catalogResponseSchema = cursorPageSchema(catalogItemSchema);
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;

export const catalogProductResponseSchema = z.strictObject({
  id: idSchema,
  slug: z.string().min(1),
  name: z.string(),
  description: z.string(),
  market: z.string().min(1),
  price: moneySchema,
  taxonomy: z.strictObject({ board: z.string(), grade: z.string(), subject: z.string() }),
  status: z.string(),
});
export type CatalogProductResponse = z.infer<typeof catalogProductResponseSchema>;

const taxonomyItemSchema = z.strictObject({
  id: idSchema,
  type: z.string(),
  slug: z.string().min(1),
  name: z.string(),
  active: z.boolean(),
});

export const taxonomyResponseSchema = cursorPageSchema(taxonomyItemSchema);
export type TaxonomyResponse = z.infer<typeof taxonomyResponseSchema>;

const quoteLineRequestSchema = z.strictObject({
  product_id: idSchema,
  learner_grade: z.string(),
  qty: z.number().int().positive(),
});

export const quoteRequestSchema = z.strictObject({
  market: z.string().min(1),
  lines: z.array(quoteLineRequestSchema).min(1),
  promo_code: z.string().min(1).optional(),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

const quoteLineResponseSchema = z.strictObject({
  product_id: idSchema,
  quantity: z.number().int().positive(),
  line_total: moneySchema,
});

export const quoteResponseSchema = z.strictObject({
  lines: z.array(quoteLineResponseSchema),
  subtotal: moneySchema,
  discount: moneySchema,
  tax: moneySchema,
  tax_rate_percent: z.number(),
  promo_percent: z.number(),
  total: moneySchema,
});
export type QuoteResponse = z.infer<typeof quoteResponseSchema>;
