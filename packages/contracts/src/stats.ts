import { z } from 'zod';
import { TRIP_STEPS } from './analytics';

// The dashboard of the admin Mini App (G12, docs/29): main numbers, funnels, errors.
export const ADMIN_STATS_PATH = '/admin/stats';
export const STATS_PERIODS = ['day', 'week'] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];
export const FUNNELS = ['passenger', 'driver', 'new_trip', 'way'] as const;
export type FunnelId = (typeof FUNNELS)[number];
// The steps of each funnel (docs/29), in order.
export const FUNNEL_STEPS = {
  passenger: ['opened', 'searched', 'trip_opened', 'requested', 'chat', 'confirmed', 'boarded'],
  driver: ['opened', 'started', 'submitted', 'approved', 'trip_created', 'confirmed'],
  new_trip: TRIP_STEPS,
  // The screen of the start and the end (G24): opened, start, end, way, the trips seen.
  way: ['opened', 'from', 'to', 'mode', 'done'],
} as const satisfies Record<FunnelId, readonly string[]>;
export type FunnelStepId = (typeof FUNNEL_STEPS)[FunnelId][number];
const STEP_IDS = [...new Set(Object.values(FUNNEL_STEPS).flat())] as [FunnelStepId, ...FunnelStepId[]];
export const MAIN_NUMBERS = ['newUsers', 'trips', 'bookings', 'driverApplications', 'complaints'] as const;
export type MainNumber = (typeof MAIN_NUMBERS)[number];

const count = z.number().int().nonnegative();
const id = z.string().regex(/^[a-z][a-z0-9_.]{0,47}$/);

export const funnelStepSchema = z.object({
  step: z.enum(STEP_IDS),
  count,
  // The share of people of the previous step who did not come here, 0 … 100; null on the first step.
  drop: z.number().min(0).max(100).nullable(),
});
export type FunnelStep = z.infer<typeof funnelStepSchema>;

export const funnelSchema = z.object({ id: z.enum(FUNNELS), steps: z.array(funnelStepSchema) });
export type Funnel = z.infer<typeof funnelSchema>;

export const errorRowSchema = z.object({ app: id, screen: id, code: id, count });
export type ErrorRow = z.infer<typeof errorRowSchema>;

export const statsSchema = z.object({
  period: z.enum(STATS_PERIODS),
  numbers: z.record(z.enum(MAIN_NUMBERS), count),
  // Funnels and errors come from the events: "off" while the analytics key is not set (docs/46),
  // "failed" when Analytics Engine did not answer.
  events: z.enum(['on', 'off', 'failed']),
  funnels: z.array(funnelSchema),
  errors: z.array(errorRowSchema),
  at: z.number().int(),
});
export type Stats = z.infer<typeof statsSchema>;

export const statsQuerySchema = z.object({ period: z.enum(STATS_PERIODS).default('day') });
