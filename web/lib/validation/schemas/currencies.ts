import { z } from 'zod';

export const createCurrencySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1),
  symbol: z.string().min(1),
  symbolPosition: z.enum(['before', 'after']).default('before'),
  decimalPlaces: z.number().int().min(0).max(10).default(2),
  exchangeRate: z.string().regex(/^\d+(\.\d+)?$/), // pass as string to preserve precision or validate format
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
}).strict();

export const updateCurrencySchema = createCurrencySchema.partial().strict();

export const currencyQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
}).strict();
