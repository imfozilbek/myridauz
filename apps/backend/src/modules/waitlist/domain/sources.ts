import { CHANNEL_VIA_PREFIX, VIA_SITE, type WaitlistSource } from '@platform/contracts';

// The link «Doʻstimni chaqiraman» of a person: «fr-» and the own code of the person, never the
// Telegram id (docs/116).
export const FRIEND_PREFIX = 'fr-';
export const AD_PREFIX = 'ad-';
const CODE_LETTERS = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const FRIEND_CODE_LENGTH = 8;
export const AD_CODE_LENGTH = 6;

// A random code of small latin letters and digits: the marks of the links (docs/116, docs/184).
export function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => CODE_LETTERS[byte % CODE_LETTERS.length]).join('');
}

// Where a person came from by the mark of the first touch (docs/116).
export function sourceOf(via: string | null): WaitlistSource {
  if (via === null) return 'direct';
  if (via.startsWith(CHANNEL_VIA_PREFIX)) return 'channel';
  if (via.startsWith(FRIEND_PREFIX)) return 'friend';
  if (via.startsWith(AD_PREFIX)) return 'ad';
  return via === VIA_SITE ? 'site' : 'other';
}
