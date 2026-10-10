import { z } from 'zod';
import { TRIP_LINK } from './launch-links';

// Where a person came from and on what (G55, docs/116). A link of the bot may end with a mark of
// its source: t.me/<bot>?startapp=<link>__<mark>. Only marks and names, never a person's words.
const VIA_SEPARATOR = '__';
const VIA_MAX = 21;
export const VIA_PATTERN = /^[a-z0-9][a-z0-9-]{0,20}$/;
// «android 9.6 chrome 120»: the Telegram app, its version and the engine with its major version.
export const CLIENT_PATTERN = /^[a-z_]{1,16}( [0-9.]{1,8})?( [a-z]{1,8} \d{1,4})?$/;
// The kind of the link: trip, sub, find ... or «direct» without a link (docs/89 S3).
const SOURCE_PATTERN = /^[a-z][a-z0-9_.]{0,47}$/;

// The marks Rida puts on its own links; an ad's mark is made by the owner: ad-<name>.
// A driver's Telegram story of the trip (docs/88 L19).
export const VIA_STORY = 'story';
export const VIA_SITE = 'site';
// The link the driver sends to people after the publishing (G63, docs/119).
export const VIA_DRIVER = 'driver';

export const arrivalSchema = z.object({
  source: z.string().regex(SOURCE_PATTERN).optional(),
  via: z.string().regex(VIA_PATTERN).optional(),
  client: z.string().regex(CLIENT_PATTERN).optional(),
});
export type Arrival = z.infer<typeof arrivalSchema>;

// A link with its mark: the link stays as it was, the screens of links read it without the mark.
export const withVia = (start: string, via: string) => `${start}${VIA_SEPARATOR}${via}`;

// A trip ready to book in the passenger bot: t.me/<bot>?startapp=trip_<id>__<mark>. The button of a
// channel post, a driver's story and the driver's own link (docs/15, docs/116, docs/119).
export const tripBookLink = (bot: string, tripId: string, via: string) =>
  `https://t.me/${bot}?startapp=${withVia(`${TRIP_LINK}_${tripId}`, via)}`;

// The search of a route in the passenger bot: t.me/<bot>?startapp=find_<from>_<to>__<mark>. The
// site and the channel posts of a full or ended trip open it (docs/59, G68).
export const routeFindLink = (bot: string, from: string, to: string, via: string) =>
  `https://t.me/${bot}?startapp=${withVia(`find_${from}_${to}`, via)}`;

// The link and the mark of a start parameter; an empty link is a mark alone (an ad to the home).
export function splitStart(param: string): { readonly start: string | null; readonly via: string | null } {
  const at = param.lastIndexOf(VIA_SEPARATOR);
  const mark = at < 0 ? '' : param.slice(at + VIA_SEPARATOR.length);
  if (!VIA_PATTERN.test(mark)) return { start: param, via: null };
  const start = param.slice(0, at);
  return { start: start === '' ? null : start, via: mark };
}

// The mark of a channel post: «ch-» and the channel's name, short enough for Telegram's 64 signs.
export const CHANNEL_VIA_PREFIX = 'ch-';
export const channelVia = (username: string) =>
  `${CHANNEL_VIA_PREFIX}${username.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    .slice(0, VIA_MAX)
    .replace(/-+$/, '');
