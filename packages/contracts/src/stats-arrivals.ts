import { z } from 'zod';

const count = z.number().int().nonnegative();

// G55 (docs/116): the new people of the period by their source and by their platform. mark: the name
// after the kind («rida-samarqand» of a channel, «insta1» of an ad), empty for the others.
// driver: the link a driver sent to people after the publishing (G63, docs/119). loop: a loop of growth,
// the mark its name without the code of the author (G69, docs/123).
// group: a group of a direction (grp-…, docs/222); bot: a button under a message of a bot (G87).
export const ARRIVAL_KINDS = [
  'channel',
  'group',
  'ad',
  'bot',
  'story',
  'site',
  'driver',
  'loop',
  'direct',
  'other',
] as const;
export type ArrivalKind = (typeof ARRIVAL_KINDS)[number];
export const PLATFORMS = ['android', 'ios', 'desktop', 'other'] as const;
export type Platform = (typeof PLATFORMS)[number];
export const arrivalsSchema = z.object({
  sources: z.array(z.object({ kind: z.enum(ARRIVAL_KINDS), mark: z.string().max(21), count })),
  platforms: z.array(z.object({ platform: z.enum(PLATFORMS), count })),
});
export type Arrivals = z.infer<typeof arrivalsSchema>;
