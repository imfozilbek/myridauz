import { z } from 'zod';
import { PLATFORMS } from '../stats';
import { CADENCES, PAINS, regionSchema } from './answers';

// What the team sees of the waitlist (G83, docs/181, docs/183): numbers only, never names (docs/29).
export const ADMIN_WAITLIST_PATH = '/admin/waitlist';
export const adminWaitlistDirectionPath = (region: string) => `${ADMIN_WAITLIST_PATH}/${region}`;
export const adminWaitlistOpenPath = (region: string) => `${ADMIN_WAITLIST_PATH}/${region}/open`;
export const ADMIN_WAITLIST_STATS_PATH = '/admin/waitlist-stats';
export const ADMIN_WAITLIST_SWITCH_PATH = '/admin/waitlist-switch';

const count = z.number().int().nonnegative();
const share = z.number().min(0).max(100);
// «Ochildi · 2-noyabr · Xabar ketdi: 133 kishiga»: the bot told the waiting people once.
export const openingSchema = z.object({ at: z.number().int(), sent: count });
export type Opening = z.infer<typeof openingSchema>;

// «Kutayotganlar»: all directions, the most waiting first; the most chosen pain of the passengers.
export const waitlistOverviewSchema = z.object({
  passengers: count,
  drivers: count,
  directions: z.array(
    z.object({ region: regionSchema, passengers: count, drivers: count, opened: openingSchema.nullable() }),
  ),
  topPain: z.object({ pain: z.enum(PAINS), share }).nullable(),
});
export type WaitlistOverview = z.infer<typeof waitlistOverviewSchema>;

const sideSchema = z.object({
  count,
  cadences: z.array(z.object({ cadence: z.enum(CADENCES), count })),
  pains: z.array(z.object({ pain: z.enum(PAINS), count, share })),
});
// One direction: who waits and how often, what hurts them; drivers whose application is approved.
export const waitlistDirectionSchema = z.object({
  region: regionSchema,
  since: z.number().int().nullable(),
  passengers: sideSchema,
  drivers: sideSchema.extend({ approved: count }),
  opened: openingSchema.nullable(),
});
export type WaitlistDirection = z.infer<typeof waitlistDirectionSchema>;

// Where people came from (docs/116): a channel, a friend's link, an ad, the site, or straight.
export const WAITLIST_SOURCES = ['channel', 'friend', 'ad', 'site', 'direct', 'other'] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];
// The «gold» of the statistics (docs/183): opened the app and got on the list, by source, by
// platform and by the hour of Tashkent; what people did after; where drivers are missing.
const reach = { opened: count, listed: count };
export const waitlistStatsSchema = z.object({
  after: z.object({ listed: count, joined: count, invited: count, byFriends: count }),
  sources: z.array(z.object({ source: z.enum(WAITLIST_SOURCES), ...reach })),
  devices: z.array(z.object({ platform: z.enum(PLATFORMS), ...reach })),
  // From the hour of a group of three hours: 0, 3 … 21.
  hours: z.array(z.object({ from: z.number().int().min(0).max(23), count })),
  shortage: z.array(z.object({ region: regionSchema, passengers: count, drivers: count })),
  cadences: z.array(z.object({ cadence: z.enum(CADENCES), count })),
  bothRoles: count,
});
export type WaitlistStats = z.infer<typeof waitlistStatsSchema>;

// The switch of the list (docs/181): open, new people get on the list; closed, the trip buttons.
export const waitlistSwitchSchema = z.object({
  open: z.boolean(),
  at: z.number().int().nullable(),
  links: count,
});
export type WaitlistSwitch = z.infer<typeof waitlistSwitchSchema>;
export const waitlistSwitchInputSchema = z.object({ open: z.boolean() });
