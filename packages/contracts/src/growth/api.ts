import { z } from 'zod';
import { SHARE_MOMENTS } from './loops';

// «Sizning taʼsiringiz» (G69, docs/123): what came of the links a person shared: who came by them
// and who of those rode; the link «Yana ulashish» carries the short code of the person.
export const MY_GROWTH_PATH = '/me/growth';
export const myGrowthSchema = z.object({
  joined: z.number().int().min(0),
  rode: z.number().int().min(0),
  link: z.string(),
});
export type MyGrowth = z.infer<typeof myGrowthSchema>;

// The badges of «Sizning taʼsiringiz»: people who came by the links (docs/123).
export const GROWTH_BADGES = [
  { id: 'companion', people: 1 },
  { id: 'ambassador', people: 5 },
  { id: 'hero', people: 25 },
] as const;

// The moment of «Men Rida bilan» a person reached and was not offered yet, with the true facts of
// its card: the route of the last trip, how many people rode in the car, the count of the moment.
export const MOMENT_PATH = '/me/moment';
const roleSchema = z.enum(['passenger', 'driver']);
export const momentQuerySchema = z.object({ side: roleSchema });
export const momentSchema = z.object({
  moment: z.enum(SHARE_MOMENTS).nullable(),
  route: z.object({ from: z.string(), to: z.string() }).nullable(),
  people: z.number().int().min(0),
  link: z.string(),
});
export type Moment = z.infer<typeof momentSchema>;

// The moment was shown: never offered again, whatever the answer (docs/123: no pressure).
export const MOMENT_OFFERED_PATH = '/me/moment/offered';
export const momentOfferedSchema = z.object({ moment: z.enum(SHARE_MOMENTS) });

// «Doʻstlarimga yuborish»: the ready message of the card with the phrase the person chose; the
// moment says the side: the bot of the app of that side keeps the message.
export const MOMENT_CARD_PATH = '/me/moment/card';
export const PHRASES = 3;
export const momentCardSchema = z.object({
  moment: z.enum(SHARE_MOMENTS),
  phrase: z
    .number()
    .int()
    .min(0)
    .max(PHRASES - 1),
});
export const preparedCardSchema = z.object({ prepared: z.string().nullable(), link: z.string() });
export type PreparedCard = z.infer<typeof preparedCardSchema>;

// The ready message of a loop outside the moments (docs/123): a request with no offer into the group
// of the district (loop 2), the free seats of a booked trip to a friend (loop 3).
export const LOOP_CARD_PATH = '/me/loop-card';
const ID = z.string().min(1).max(64);
export const loopCardSchema = z.discriminatedUnion('loop', [
  z.object({ loop: z.literal('req-share'), requestId: ID }),
  z.object({ loop: z.literal('seats'), bookingId: ID }),
]);
export type LoopCard = z.infer<typeof loopCardSchema>;

// «Hikoyamga joylash»: the Mini App draws the card, the API keeps it a day behind a public link
// (stories/, docs/117) like the story of a trip.
export const MOMENT_STORY_PATH = '/me/moment/story';
export const momentStorySchema = z.object({ imageUrl: z.string() });
