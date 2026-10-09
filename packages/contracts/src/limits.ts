import { z } from 'zod';

// «Cheklovlar» of the owner (G75, docs/128 §4): the limits of people the owner changes in the admin
// app. A key is the path of the value in the brand config, the default; the change is kept in D1 with
// its history and the server reads it. The limits of protection (speed, sizes, sign-in) are not here.
export const ADMIN_LIMITS_PATH = '/admin/limits';
export const adminLimitPath = (key: LimitKey) => `${ADMIN_LIMITS_PATH}/${key}`;

export const LIMIT_UNITS = ['count', 'minutes', 'hours', 'days', 'percent', 'sum', 'hour'] as const;
type LimitRule = { readonly min: number; readonly max: number; readonly unit: (typeof LIMIT_UNITS)[number] };

export const LIMITS = {
  'commission.percent': { min: 0, max: 30, unit: 'percent' },
  'commission.minPerSeat': { min: 0, max: 50_000, unit: 'sum' },
  'promo.amount': { min: 0, max: 5_000_000, unit: 'sum' },
  'promo.grants': { min: 0, max: 12, unit: 'count' },
  'promo.days': { min: 1, max: 365, unit: 'days' },
  'promo.windowDays': { min: 1, max: 730, unit: 'days' },
  'schedule.leadMinutes': { min: 0, max: 240, unit: 'minutes' },
  'schedule.maxActiveTrips': { min: 1, max: 10, unit: 'count' },
  'calls.requestRings': { min: 0, max: 10, unit: 'count' },
  'moderation.hours.from': { min: 0, max: 23, unit: 'hour' },
  'moderation.hours.to': { min: 1, max: 24, unit: 'hour' },
  'moderation.remindMinutes': { min: 5, max: 240, unit: 'minutes' },
  'moderation.ownerMinutes': { min: 5, max: 480, unit: 'minutes' },
} as const satisfies Record<string, LimitRule>;
export type LimitKey = keyof typeof LIMITS;
export const LIMIT_KEYS = Object.keys(LIMITS) as [LimitKey, ...LimitKey[]];

export const limitChangeSchema = z.object({ value: z.number().finite() });

export const limitsSchema = z.object({
  limits: z.array(z.object({ key: z.enum(LIMIT_KEYS), value: z.number(), base: z.number() })),
  history: z.array(
    z.object({
      key: z.enum(LIMIT_KEYS),
      before: z.number(),
      after: z.number(),
      by: z.string(),
      at: z.number().int(),
    }),
  ),
});
export type Limits = z.infer<typeof limitsSchema>;

// A value the owner may set: within the rule, whole numbers.
export const limitFits = (key: LimitKey, value: number) =>
  Number.isInteger(value) && value >= LIMITS[key].min && value <= LIMITS[key].max;
