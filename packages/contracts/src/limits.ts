import { z } from 'zod';

// «Cheklovlar» of the owner (G75, docs/128 §4): the limits of people the owner changes in the admin
// app. A key is the path of the value in the brand config, the default; the change is kept in D1 with
// its history and the server reads it. The limits of protection (speed, sizes, sign-in) are not here.
export const ADMIN_LIMITS_PATH = '/admin/limits';
// The values the owner set, for every Mini App: the brand defaults stay for the rest.
export const PUBLIC_LIMITS_PATH = '/public/limits';
export const adminLimitPath = (key: LimitKey) => `${ADMIN_LIMITS_PATH}/${key}`;

export const LIMIT_UNITS = ['count', 'minutes', 'hours', 'days', 'percent', 'sum', 'hour', 'stars'] as const;
// A value is a whole number, the stars in tenths.
type LimitRule = { readonly min: number; readonly max: number; readonly unit: (typeof LIMIT_UNITS)[number] };
const STARS_STEP = 0.1;

export const LIMITS = {
  'commission.percent': { min: 0, max: 30, unit: 'percent' },
  'commission.minPerSeat': { min: 0, max: 50_000, unit: 'sum' },
  'promo.amount': { min: 0, max: 5_000_000, unit: 'sum' },
  'promo.grants': { min: 0, max: 12, unit: 'count' },
  'promo.days': { min: 1, max: 365, unit: 'days' },
  'promo.windowDays': { min: 1, max: 730, unit: 'days' },
  'schedule.leadMinutes': { min: 0, max: 240, unit: 'minutes' },
  'schedule.maxActiveTrips': { min: 1, max: 10, unit: 'count' },
  'schedule.daysAhead': { min: 1, max: 90, unit: 'days' },
  'schedule.shiftMinutes': { min: 0, max: 240, unit: 'minutes' },
  'schedule.meetMinutes': { min: 10, max: 120, unit: 'minutes' },
  'schedule.autoDepartHours': { min: 1, max: 6, unit: 'hours' },
  'bookings.maxPending': { min: 1, max: 10, unit: 'count' },
  'bookings.answerHours': { min: 1, max: 72, unit: 'hours' },
  'requests.maxOpen': { min: 1, max: 10, unit: 'count' },
  'requests.maxSeats': { min: 1, max: 7, unit: 'count' },
  'wallet.fewSeats': { min: 0, max: 50, unit: 'count' },
  'chat.afterTripHours': { min: 0, max: 168, unit: 'hours' },
  'subscriptions.max': { min: 1, max: 20, unit: 'count' },
  'subscriptions.anyDateDays': { min: 1, max: 90, unit: 'days' },
  'shares.followers': { min: 1, max: 10, unit: 'count' },
  'favorites.max': { min: 1, max: 200, unit: 'count' },
  'ratings.days': { min: 1, max: 30, unit: 'days' },
  'ratings.blindDays': { min: 1, max: 30, unit: 'days' },
  'ratings.remindHours': { min: 1, max: 168, unit: 'hours' },
  'ratings.minShown': { min: 1, max: 20, unit: 'count' },
  'ratings.lowAverage': { min: 1, max: 5, unit: 'stars' },
  'ratings.lowCount': { min: 1, max: 100, unit: 'count' },
  'complaints.days': { min: 1, max: 30, unit: 'days' },
  'complaints.hideAfter': { min: 1, max: 10, unit: 'count' },
  'complaints.windowDays': { min: 1, max: 90, unit: 'days' },
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

// The owner's values for the Mini Apps: only the limits the owner changed.
export const ownerLimitsSchema = z.object({ values: z.partialRecord(z.enum(LIMIT_KEYS), z.number()) });
export type OwnerLimits = z.infer<typeof ownerLimitsSchema>;

// A value the owner may set: within the rule, whole numbers (the stars in tenths).
export function limitFits(key: LimitKey, value: number): boolean {
  const rule: LimitRule = LIMITS[key];
  const step = rule.unit === 'stars' ? STARS_STEP : 1;
  const whole = Math.abs(Math.round(value / step) * step - value) < Number.EPSILON * 8;
  return whole && value >= rule.min && value <= rule.max;
}

type Tree = { readonly [name: string]: unknown };

// The value of a limit in a brand config: the default the owner starts from (docs/128 §4).
export function limitIn(config: object, key: LimitKey): number {
  let node: unknown = config;
  for (const name of key.split('.')) node = (node as Tree)[name];
  return typeof node === 'number' ? node : Number.NaN;
}

function setIn(tree: Tree, path: readonly string[], value: number): Tree {
  const [name, ...rest] = path;
  if (name === undefined) return tree;
  return { ...tree, [name]: rest.length === 0 ? value : setIn(tree[name] as Tree, rest, value) };
}

// The brand config with the limits the owner set; a value out of its rule is never used (G75).
export function withLimits<T extends object>(config: T, values: OwnerLimits['values']): T {
  let tree = config as Tree;
  for (const key of LIMIT_KEYS) {
    const value = values[key];
    if (value !== undefined && limitFits(key, value)) tree = setIn(tree, key.split('.'), value);
  }
  return tree as T;
}
