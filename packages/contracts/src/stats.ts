import { z } from 'zod';
import { TRIP_STEPS } from './analytics';
import { complaintReasonCountSchema, leaveCountSchema, openCountSchema, ratingsSummarySchema } from './voice';

// G87: what people feel (docs/191) is a part of the dashboard.
export * from './voice';

// The dashboard of the admin Mini App (G12, docs/29): main numbers, funnels, errors.
export const ADMIN_STATS_PATH = '/admin/stats';
export const STATS_PERIODS = ['day', 'week'] as const;
export type StatsPeriod = (typeof STATS_PERIODS)[number];
export const FUNNELS = [
  'passenger',
  'driver',
  'new_trip',
  'way',
  'waitlist',
  'waitlist_passenger',
  'waitlist_driver',
] as const;
export type FunnelId = (typeof FUNNELS)[number];
const WAITLIST_FUNNEL = ['role', 'pains', 'route', 'when', 'listed'] as const;
// The steps of each funnel (docs/29), in order.
export const FUNNEL_STEPS = {
  passenger: ['opened', 'searched', 'trip_opened', 'requested', 'chat', 'confirmed', 'boarded'],
  driver: ['opened', 'started', 'submitted', 'approved', 'trip_created', 'confirmed'],
  new_trip: TRIP_STEPS,
  // The route of a search by lists (G26, docs/74): opened, start, end, the trips seen.
  way: ['opened', 'from', 'to', 'done'],
  // The waitlist of G83 (docs/183): from the bot to the list, then each role step by step.
  waitlist: ['bot_opened', 'opened', 'role_chosen', 'listed'],
  waitlist_passenger: WAITLIST_FUNNEL,
  waitlist_driver: WAITLIST_FUNNEL,
} as const satisfies Record<FunnelId, readonly string[]>;
export type FunnelStepId = (typeof FUNNEL_STEPS)[FunnelId][number];
const STEP_IDS = [...new Set(Object.values(FUNNEL_STEPS).flat())] as [FunnelStepId, ...FunnelStepId[]];
export const funnelStepIdSchema = z.enum(STEP_IDS);
// activeTrips: the trips people can book now, on the main screen of the admin (G53).
export const MAIN_NUMBERS = [
  'newUsers',
  'trips',
  'activeTrips',
  'bookings',
  'driverApplications',
  'complaints',
] as const;
export type MainNumber = (typeof MAIN_NUMBERS)[number];
// The numbers counted over a period, compared with the period before it (F-A12 of docs/90, G45); the
// live trips are a number of now.
export type CountedNumber = Exclude<MainNumber, 'activeTrips'>;

const count = z.number().int().nonnegative();
const id = z.string().regex(/^[a-z][a-z0-9_.]{0,47}$/);

export const funnelStepSchema = z.object({
  step: funnelStepIdSchema,
  count,
  // The share of people of the previous step who did not come here, 0 … 100; null on the first step.
  drop: z.number().min(0).max(100).nullable(),
});
export type FunnelStep = z.infer<typeof funnelStepSchema>;

export const funnelSchema = z.object({ id: z.enum(FUNNELS), steps: z.array(funnelStepSchema) });
export type Funnel = z.infer<typeof funnelSchema>;

// G52 (docs/112): a crash of a screen and a failure of the server come first; a refusal of a rule
// (a limit, a changed status) is not a breakage. what: the words of a crash, the place of a failure.
export const ERROR_KINDS = ['crash', 'server', 'refusal'] as const;
export const errorRowSchema = z.object({
  kind: z.enum(ERROR_KINDS),
  app: id,
  screen: id,
  code: id,
  what: z.string().max(170),
  count,
});
export type ErrorRow = z.infer<typeof errorRowSchema>;

// G55 (docs/116): the new people of the period by their source and by their platform. mark: the name
// after the kind («rida-samarqand» of a channel, «insta1» of an ad), empty for the others.
// driver: the link a driver sent to people after the publishing (G63, docs/119). loop: a loop of growth,
// the mark its name without the code of the author (G69, docs/123).
export const ARRIVAL_KINDS = ['channel', 'ad', 'story', 'site', 'driver', 'loop', 'direct', 'other'] as const;
export type ArrivalKind = (typeof ARRIVAL_KINDS)[number];
export const PLATFORMS = ['android', 'ios', 'desktop', 'other'] as const;
export type Platform = (typeof PLATFORMS)[number];
export const arrivalsSchema = z.object({
  sources: z.array(z.object({ kind: z.enum(ARRIVAL_KINDS), mark: z.string().max(21), count })),
  platforms: z.array(z.object({ platform: z.enum(PLATFORMS), count })),
});
export type Arrivals = z.infer<typeof arrivalsSchema>;

// G85 T1 (docs/122): the bots under load. sent: what Telegram took; limited: its 429 answers; dead:
// the messages lost after the last try; peak: the most messages of the bot in one second. queueOps:
// the operations of the queue a day (a write, a read, a delete).
export const MESSAGE_BOTS = ['passenger', 'driver', 'admin', 'poster', 'main'] as const;
export const botLoadSchema = z.object({
  bot: z.enum(MESSAGE_BOTS),
  sent: count,
  limited: count,
  dead: count,
  peak: count,
});
export type BotLoad = z.infer<typeof botLoadSchema>;

// G87 (docs/191): the people who blocked a bot in the period and the ones who came back to it. A list
// of its own: an open admin app of before G87 reads the new answer without it.
export const BLOCK_BOTS = ['passenger', 'driver', 'admin', 'support', 'main'] as const;
export const botBlockSchema = z.object({ bot: z.enum(BLOCK_BOTS), blocked: count, unblocked: count });
export type BotBlock = z.infer<typeof botBlockSchema>;

export const statsSchema = z.object({
  period: z.enum(STATS_PERIODS),
  numbers: z.record(z.enum(MAIN_NUMBERS), count),
  // The same numbers of the period before (G45); an answer of before G45: none.
  before: z.partialRecord(z.enum(MAIN_NUMBERS), count).default({}),
  arrivals: arrivalsSchema,
  // Funnels and errors come from the events: "off" while the analytics key is not set (docs/46),
  // "failed" when Analytics Engine did not answer.
  events: z.enum(['on', 'off', 'failed']),
  funnels: z.array(funnelSchema),
  errors: z.array(errorRowSchema),
  bots: z.array(botLoadSchema),
  queueOps: count,
  // G87 (docs/191): the people who blocked the bots, the ratings and the reasons of the complaints from
  // the database, the reasons of leaving and the ways the apps were opened from the events. A Worker
  // rolled back to before G87 answers without them: empty then.
  blocks: z.array(botBlockSchema).default([]),
  ratings: ratingsSummarySchema.default({ count: 0, average: 0, low: 0, tags: [] }),
  complaintReasons: z.array(complaintReasonCountSchema).default([]),
  leaving: z.array(leaveCountSchema).default([]),
  opens: z.array(openCountSchema).default([]),
  at: z.number().int(),
});
export type Stats = z.infer<typeof statsSchema>;

export const statsQuerySchema = z.object({ period: z.enum(STATS_PERIODS).default('day') });
