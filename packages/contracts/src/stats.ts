import { z } from 'zod';
import { TRIP_STEPS } from './analytics';
import { cancelReasonFields } from './cancel-reasons';

export { CANCEL_REASONS, type CancelReason, type CancelWhat } from './cancel-reasons';

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
// the operations of the queue a day (a write, a read, a delete). support: the bot of the help desk.
export const MESSAGE_BOTS = ['passenger', 'driver', 'admin', 'poster', 'main', 'support'] as const;
export const botLoadSchema = z.object({
  bot: z.enum(MESSAGE_BOTS),
  sent: count,
  limited: count,
  dead: count,
  peak: count,
  // G87 V1: the people who blocked the bot in the period, and who came back after a block.
  blocked: count,
  returned: count,
});
export type BotLoad = z.infer<typeof botLoadSchema>;

// G87 V2 (docs/191): what the reviews and complaints of the period say. average: the stars with one
// decimal, null without reviews; lowShare: the percent of 1 and 2 stars; the five most chosen tags and
// the five most given reasons of complaints.
export const feelingsSchema = z.object({
  reviews: count,
  average: z.number().min(1).max(5).nullable(),
  lowShare: z.number().int().min(0).max(100),
  tags: z.array(z.object({ tag: id, count })),
  reasons: z.array(z.object({ reason: id, count })),
});
export type Feelings = z.infer<typeof feelingsSchema>;

// G87 V3: the reasons of cancels and deletions chosen in one tap, the most given first.
export const cancelReasonCountSchema = z.object({ ...cancelReasonFields, count });
export type CancelReasonCount = z.infer<typeof cancelReasonCountSchema>;

// G87 V4 (docs/116): how the sessions of the period began: a button of a bot message, a direct visit
// (the menu button, the profile of the bot) or a link (a channel, an ad, a friend).
export const ENTRIES = ['bot', 'direct', 'link'] as const;
export type Entry = (typeof ENTRIES)[number];
export const entriesSchema = z.object({ bot: count, direct: count, link: count });
export type Entries = z.infer<typeof entriesSchema>;

export const statsSchema = z.object({
  period: z.enum(STATS_PERIODS),
  numbers: z.record(z.enum(MAIN_NUMBERS), count),
  arrivals: arrivalsSchema,
  feelings: feelingsSchema,
  // Funnels and errors come from the events: "off" while the analytics key is not set (docs/46),
  // "failed" when Analytics Engine did not answer.
  events: z.enum(['on', 'off', 'failed']),
  funnels: z.array(funnelSchema),
  errors: z.array(errorRowSchema),
  bots: z.array(botLoadSchema),
  cancelReasons: z.array(cancelReasonCountSchema),
  entries: entriesSchema,
  queueOps: count,
  at: z.number().int(),
});
export type Stats = z.infer<typeof statsSchema>;

export const statsQuerySchema = z.object({ period: z.enum(STATS_PERIODS).default('day') });
