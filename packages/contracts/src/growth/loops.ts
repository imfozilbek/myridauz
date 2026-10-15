import { z } from 'zod';

// The loops of growth (G69, docs/123): a shared link carries its loop and the short code of the
// person who shared it, never the id (docs/116): <loop>-<code>, up to 21 signs.
export const AUTHOR_CODE_LENGTH = 6;
export const GROWTH_LOOPS = [
  // 1: the QR of a driver on the glass; 2: a request with no offer into the group of the district.
  'qr',
  'req-share',
  // 3: «Doʻstingni chaqir», the free seats of a trip; 4: the line of «Yaqinlarimga».
  'seats',
  'follow',
  // 5: the cards «Men Rida bilan» of the moments.
  'share-join',
  'share-trip',
  'share-driver',
  'share-riders',
] as const;
export type GrowthLoop = (typeof GROWTH_LOOPS)[number];

export const loopVia = (loop: GrowthLoop, code: string) => `${loop}-${code}`;

const LOOP_VIA = new RegExp(`^(${GROWTH_LOOPS.join('|')})-([a-z0-9]{${AUTHOR_CODE_LENGTH}})$`);

// The loop and the author of a mark; null for the marks of channels, ads and the site.
export function loopOf(via: string): { readonly loop: GrowthLoop; readonly code: string } | null {
  const found = LOOP_VIA.exec(via);
  const [, loop, code] = found ?? [];
  return loop && code ? { loop: loop as GrowthLoop, code } : null;
}

// The moments of «Men Rida bilan» (docs/123): a person is offered each one once, never forced.
export const SHARE_MOMENTS = [
  'join',
  'trip1',
  'trip5',
  'trip10',
  'trip25',
  'driver',
  'riders10',
  'riders50',
  'riders100',
] as const;
export type ShareMoment = (typeof SHARE_MOMENTS)[number];

// The texts of a moment (docs/123): the first trip has its own, the round counts share theirs.
export type MomentKind = 'join' | 'trip1' | 'trips' | 'driver' | 'riders';
const MOMENT_KIND = {
  join: 'join',
  trip1: 'trip1',
  trip5: 'trips',
  trip10: 'trips',
  trip25: 'trips',
  driver: 'driver',
  riders10: 'riders',
  riders50: 'riders',
  riders100: 'riders',
} as const satisfies Record<ShareMoment, MomentKind>;
export const momentKind = (moment: ShareMoment): MomentKind => MOMENT_KIND[moment];
// The round count of a moment: the trips or the people; 0 for a moment without one.
export const momentCount = (moment: ShareMoment) => Number(moment.replace(/\D/gu, '')) || 0;

const KIND_LOOP = {
  join: 'share-join',
  trip1: 'share-trip',
  trips: 'share-trip',
  driver: 'share-driver',
  riders: 'share-riders',
} as const satisfies Record<MomentKind, GrowthLoop>;
// The loop of the link a moment's card carries.
export const momentLoop = (moment: ShareMoment): GrowthLoop => KIND_LOOP[momentKind(moment)];

// share_shown and share_done (docs/123, docs/29): which button was shown or used, and where to.
export const SHARE_TARGETS = ['story', 'chat'] as const;
export const shareFields = {
  button: z.enum([...GROWTH_LOOPS]),
  target: z.enum(SHARE_TARGETS).optional(),
};
