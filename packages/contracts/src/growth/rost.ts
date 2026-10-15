import { z } from 'zod';
import { GROWTH_LOOPS } from './loops';

// «Rost» of the team (G69, docs/123): each loop of growth, the people who came by its links (the
// sessions of Analytics Engine), registered (D1) and rode; and each direction, how many searches found
// a trip (the capture of a direction goes on after 70 %).
export const ADMIN_ROST_PATH = '/admin/rost';
const count = z.number().int().nonnegative();
export const rostSchema = z.object({
  period: z.enum(['week', 'month']),
  // The sessions come from the events: "off" without the analytics key, "failed" when it did not answer.
  events: z.enum(['on', 'off', 'failed']),
  loops: z.array(z.object({ loop: z.enum(GROWTH_LOOPS), came: count, registered: count, rode: count })),
  // route: the two regions of the search, «1726-1718».
  directions: z.array(z.object({ route: z.string().regex(/^\d{4}-\d{4}$/), searches: count, found: count })),
  at: z.number().int(),
});
export type Rost = z.infer<typeof rostSchema>;
export type RostPeriod = Rost['period'];
export const rostQuerySchema = z.object({ period: z.enum(['week', 'month']).default('week') });
