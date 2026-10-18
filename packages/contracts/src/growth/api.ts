import { z } from 'zod';
import { LINK_ID } from '../launch-links';
import { SHARE_MOMENTS } from './loops';

// «Sizning taʼsiringiz» (G69, docs/123): what came of the links a person shared: who came by them
// and who of those rode. «Yana ulashish» is a card of the loop share-join (G88).
export const MY_GROWTH_PATH = '/me/growth';
export const myGrowthSchema = z.object({
  joined: z.number().int().min(0),
  rode: z.number().int().min(0),
  // The QR of a driver on the glass (loop 1): the same start with the mark qr-<code>.
  qr: z.string(),
});
export type MyGrowth = z.infer<typeof myGrowthSchema>;

// The badges of «Sizning taʼsiringiz»: people who came by the links (docs/123).
export const GROWTH_BADGES = [
  { id: 'companion', people: 1 },
  { id: 'ambassador', people: 5 },
  { id: 'hero', people: 25 },
] as const;

// The moment of «Men Rida bilan» a person reached and was not offered yet, with the link of its
// card: the start of the bot with the mark of the moment and the short code of the person.
export const MOMENT_PATH = '/me/moment';
const roleSchema = z.enum(['passenger', 'driver']);
export const momentQuerySchema = z.object({ side: roleSchema });
export const momentSchema = z.object({
  moment: z.enum(SHARE_MOMENTS).nullable(),
  link: z.string(),
});
export type Moment = z.infer<typeof momentSchema>;

// The moment was shown: never offered again, whatever the answer (docs/123: no pressure).
export const MOMENT_OFFERED_PATH = '/me/moment/offered';
export const momentOfferedSchema = z.object({ moment: z.enum(SHARE_MOMENTS) });

// «Yoʻlovchilarimga yuborish»: the ready message of the card with the phrase the person chose; the
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
// text: the words of the card for an old Telegram without shareMessage (t.me/share/url, G88).
export const preparedCardSchema = z.object({
  prepared: z.string().nullable(),
  link: z.string(),
  text: z.string(),
});
export type PreparedCard = z.infer<typeof preparedCardSchema>;

// The ready message of a loop outside the moments (docs/123): a request with no offer into the group
// of the district (loop 2), the free seats of a booked trip to a friend (loop 3), the driver's own
// trip (G88, loop 1) and «Yana ulashish» of «Sizning taʼsiringiz». The bot of the app keeps it.
export const LOOP_CARD_PATH = '/me/loop-card';
const ID = z.string().min(1).max(64);
export const loopCardSchema = z.discriminatedUnion('loop', [
  z.object({ loop: z.literal('req-share'), requestId: ID }),
  z.object({ loop: z.literal('seats'), bookingId: ID }),
  // picture: the id of the trip's picture kept a day (CARD_PICTURE_PATH); none: a card of text.
  z.object({ loop: z.literal('trip'), tripId: ID, picture: z.string().regex(LINK_ID).optional() }),
  z.object({ loop: z.literal('share-join') }),
]);
export type LoopCard = z.infer<typeof loopCardSchema>;

// «Hikoyamga joylash» and the QR of a driver: the Mini App draws the picture, the API keeps it a day
// behind a public link (stories/, docs/117) like the story of a trip; Telegram reads it from there.
export const MOMENT_STORY_PATH = '/me/moment/story';
export const QR_PICTURE_PATH = '/me/qr';
export const QR_TYPE = 'image/png';
export const pictureSchema = z.object({ imageUrl: z.string() });

// The picture of the driver's trip for its chat card (G88, docs/193): the Mini App draws it, the API
// keeps it a day like a story and gives its id to the card.
export const CARD_PICTURE_PATH = '/me/card-picture';
export const cardPictureSchema = z.object({ id: z.string().regex(LINK_ID) });
