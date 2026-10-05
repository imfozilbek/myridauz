import { z } from 'zod';

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

export const arrivalSchema = z.object({
  source: z.string().regex(SOURCE_PATTERN).optional(),
  via: z.string().regex(VIA_PATTERN).optional(),
  client: z.string().regex(CLIENT_PATTERN).optional(),
});
export type Arrival = z.infer<typeof arrivalSchema>;

// A link with its mark: the link stays as it was, the screens of links read it without the mark.
export const withVia = (start: string, via: string) => `${start}${VIA_SEPARATOR}${via}`;

// The link and the mark of a start parameter; an empty link is a mark alone (an ad to the home).
export function splitStart(param: string): { readonly start: string | null; readonly via: string | null } {
  const at = param.lastIndexOf(VIA_SEPARATOR);
  const mark = at < 0 ? '' : param.slice(at + VIA_SEPARATOR.length);
  if (!VIA_PATTERN.test(mark)) return { start: param, via: null };
  const start = param.slice(0, at);
  return { start: start === '' ? null : start, via: mark };
}

// The mark of a channel post: «ch-» and the channel's name, short enough for Telegram's 64 signs.
export const channelVia = (username: string) =>
  `ch-${username.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.slice(0, VIA_MAX).replace(/-+$/, '');
