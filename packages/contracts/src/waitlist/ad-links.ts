import { z } from 'zod';

// Links for ads (G83, docs/184): each ad gets its own link with a mark, into the main bot or into a
// channel by its own invite link. Only the link: the content is the seller's (owner, 14.10.2026).
export const ADMIN_AD_LINKS_PATH = '/admin/ad-links';
export const adminAdLinkPath = (code: string) => `${ADMIN_AD_LINKS_PATH}/${code}`;
export const AD_TARGETS = ['bot', 'channel'] as const;
export const AD_PLACES = ['telegram', 'instagram', 'blogger', 'other'] as const;
// The terms the way channels sell an ad: days in the channel (none: for good), hours on top with no
// other post, hours pinned.
export const AD_DAYS = [1, 2, 3, 7] as const;
export const AD_TOP_HOURS = [0, 1, 2, 3] as const;
export const AD_PIN_HOURS = [0, 12, 24, 48] as const;
// «ad-» and 6 random letters and digits: the name of the ad never shows to the seller (docs/116).
export const AD_CODE = /^ad-[a-z0-9]{6}$/u;
export const AD_NAME_MAX = 32;
const MAX_PRICE = 1_000_000_000;

const literal = <T extends readonly number[]>(values: T) =>
  z.number().refine((value): value is T[number] => values.includes(value));

export const adLinkInputSchema = z
  .object({
    target: z.enum(AD_TARGETS),
    // The chat of a brand channel, or «@name» of the main channel.
    channel: z.string().min(1).max(64).nullable(),
    place: z.enum(AD_PLACES),
    name: z.string().trim().min(1).max(AD_NAME_MAX),
    price: z.number().int().min(0).max(MAX_PRICE).nullable(),
    days: literal(AD_DAYS).nullable(),
    top: literal(AD_TOP_HOURS),
    pin: literal(AD_PIN_HOURS),
  })
  .refine(({ target, channel }) => (target === 'channel') === (channel !== null));
export type AdLinkInput = z.infer<typeof adLinkInputSchema>;

const count = z.number().int().nonnegative();
// What one ad gave (docs/184): into the bot, pressed, opened the app, got on the list; into a channel,
// joined, stayed, got on the list. byFriends: the friends of these people who got on the list.
export const adResultSchema = z.object({
  clicked: count,
  opened: count,
  passengers: count,
  drivers: count,
  joined: count,
  stayed: count,
  byFriends: count,
});
export type AdResult = z.infer<typeof adResultSchema>;

export const adLinkSchema = z.object({
  code: z.string().regex(AD_CODE),
  link: z.url(),
  target: z.enum(AD_TARGETS),
  channel: z.string().nullable(),
  place: z.enum(AD_PLACES),
  name: z.string(),
  price: count.nullable(),
  days: count.nullable(),
  top: count,
  pin: count,
  at: z.number().int(),
  result: adResultSchema,
});
export type AdLink = z.infer<typeof adLinkSchema>;
export const adLinksSchema = z.object({ links: z.array(adLinkSchema) });
