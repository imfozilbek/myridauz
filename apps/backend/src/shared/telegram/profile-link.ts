import type { BrandConfig } from '@platform/brands';

// The bots whose Mini App a person opens: the bot then knows the person.
export type PersonBot = 'passenger' | 'driver' | 'admin';

// The team opens the Telegram profile of a person through the bot the person writes to (owner,
// 18.10.2026): Telegram opens a profile by its number only in a bot the person knows. The link
// carries the public id, never the Telegram ID (docs/65 A3).
const PREFIX = 'profile_';
const PAYLOAD = /^profile_([0-9a-f]{32})$/u;

export const profileLink = (brand: BrandConfig, bot: PersonBot, publicId: string) =>
  `https://t.me/${brand.bots[bot]}?start=${PREFIX}${publicId}`;

// The public id in "/start profile_<id>", or null for any other start.
export const profileOf = (payload: string) => PAYLOAD.exec(payload)?.[1] ?? null;
