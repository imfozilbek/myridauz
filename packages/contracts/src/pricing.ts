import { z } from 'zod';
import { locationIdSchema } from './locations';

// The price engine (docs/23): a recommended share of costs per seat, in sum. G07.
export const PRICE_RECOMMENDATION_PATH = '/prices/recommendation';
export const ADMIN_PRICING_PATH = '/admin/pricing';
export const ADMIN_PRICING_PREVIEW_PATH = '/admin/pricing/preview';
export const ADMIN_PRICING_ROLLBACK_PATH = '/admin/pricing/rollback';
export const ADMIN_DIRECTIONS_PATH = '/admin/pricing/directions';

// Wide technical bounds only: the team sets the real values in the admin Mini App (docs/16).
const MAX_SUM = 10_000_000;
const sum = z.number().int().min(0).max(MAX_SUM);

export const pricingVariablesSchema = z
  .object({
    ratePerKm: sum.min(1),
    roundStep: sum.min(1),
    minPrice: sum,
    maxPrice: sum,
  })
  .refine((variables) => variables.minPrice < variables.maxPrice, { path: ['maxPrice'] });
export type PricingVariables = z.infer<typeof pricingVariablesSchema>;

// manual: a price the team set for the direction; formula: km × rate (docs/09).
export const PRICE_SOURCES = ['manual', 'formula'] as const;
export const recommendationSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  km: z.number().int(),
  price: sum,
  source: z.enum(PRICE_SOURCES),
  // The bounds a person may choose within (docs/09).
  minPrice: sum,
  maxPrice: sum,
  // The step a person changes the price by, the same as the rounding of the formula.
  roundStep: sum,
});
export type Recommendation = z.infer<typeof recommendationSchema>;

// Every change of the variables is a new version: who, when, what (docs/23).
const versionSchema = z.object({
  version: z.number().int().min(1),
  variables: pricingVariablesSchema,
  changedBy: z.number().int().nullable(),
  changedAt: z.number().int(),
});
export type PricingVersion = z.infer<typeof versionSchema>;
export const pricingStateSchema = z.object({ current: versionSchema, history: z.array(versionSchema) });
export type PricingState = z.infer<typeof pricingStateSchema>;

// "Было → стало" on the main directions before saving (docs/23).
export const pricingPreviewSchema = z.object({
  rows: z.array(
    z.object({ from: locationIdSchema, to: locationIdSchema, km: z.number().int(), before: sum, after: sum }),
  ),
});
export type PricingPreview = z.infer<typeof pricingPreviewSchema>;

export const rollbackSchema = z.object({ version: z.number().int().min(1) });

// A direction: region or place → region or place. price null removes the team's price.
export const directionPriceSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  price: sum.nullable(),
});
export type DirectionPrice = z.infer<typeof directionPriceSchema>;

const directionSchema = z.object({
  from: locationIdSchema,
  to: locationIdSchema,
  km: z.number().int().nullable(),
  formula: sum.nullable(),
  manual: sum.nullable(),
});
export type Direction = z.infer<typeof directionSchema>;
export const directionsSchema = z.object({ directions: z.array(directionSchema) });
