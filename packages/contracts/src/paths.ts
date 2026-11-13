import { z } from 'zod';
import { ARRIVAL_KINDS } from './stats-arrivals';
import { STATS_PERIODS } from './stats-period';

// G99 (docs/234): the path of the people by the source of their first touch, by the version of
// Telegram and by the platform. People, not events: each one counted once on a step.
export const ADMIN_PATHS_PATH = '/admin/stats/paths';
// The file for the analyst: the admin bot sends it to the owner (T6).
export const ADMIN_PATHS_FILE_PATH = '/admin/stats/paths/file';

export const PATH_ROLES = ['passenger', 'driver'] as const;
export type PathRole = (typeof PATH_ROLES)[number];
export const PATH_STEPS = {
  passenger: ['opened', 'from', 'to', 'searched', 'found', 'trip_opened', 'requested', 'confirmed', 'rode'],
  driver: ['opened', 'submitted', 'approved', 'trip_created', 'first_booking', 'trip_done'],
} as const satisfies Record<PathRole, readonly string[]>;
export type PathStepId = (typeof PATH_STEPS)[PathRole][number];
const STEP_IDS = [...new Set(Object.values(PATH_STEPS).flat())] as [PathStepId, ...PathStepId[]];

// The version of Telegram WebApp: below 7.0, 7.x, 8.x and later; none: an app that did not say it.
export const TG_BUCKETS = ['old', 'v7', 'v8', 'none'] as const;
export type TgBucket = (typeof TG_BUCKETS)[number];
// unknown: Telegram itself did not know (often an app of others); other: a name Rida does not list.
export const TG_PLATFORMS = [
  'android',
  'ios',
  'tdesktop',
  'macos',
  'weba',
  'webk',
  'unknown',
  'other',
] as const;
export type TgPlatform = (typeof TG_PLATFORMS)[number];

const count = z.number().int().nonnegative();
export const pathSchema = z.object({
  role: z.enum(PATH_ROLES),
  steps: z.array(
    z.object({
      step: z.enum(STEP_IDS),
      count,
      // The share of the people of the step before who did not come here; null on the first step.
      drop: z.number().min(0).max(100).nullable(),
    }),
  ),
});
export type Path = z.infer<typeof pathSchema>;

// One slice: its people and errors (a crash of a screen, a refused request) and the two paths.
const slice = { people: count, errors: count, paths: z.array(pathSchema) };
export const pathsSchema = z.object({
  period: z.enum(STATS_PERIODS),
  // From the events: «off» while the analytics key is not set, «failed» when it did not answer.
  events: z.enum(['on', 'off', 'failed']),
  sources: z.array(z.object({ kind: z.enum(ARRIVAL_KINDS), ...slice })),
  versions: z.array(z.object({ tg: z.enum(TG_BUCKETS), ...slice })),
  platforms: z.array(z.object({ platform: z.enum(TG_PLATFORMS), ...slice })),
  at: z.number().int(),
});
export type Paths = z.infer<typeof pathsSchema>;
