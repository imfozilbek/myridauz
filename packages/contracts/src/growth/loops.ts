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
  'share-driver',
  // 1 too (G88, docs/193): the link of the driver's trip and the story of the trip.
  'trip',
  'story',
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

// The moments of «Men Rida bilan» (docs/123): a person is offered each one once, never forced. No
// moment after a trip: the trip ends with the stars (owner decision 15.10.2026).
export const SHARE_MOMENTS = ['join', 'driver'] as const;
export type ShareMoment = (typeof SHARE_MOMENTS)[number];

const MOMENT_LOOP = {
  join: 'share-join',
  driver: 'share-driver',
} as const satisfies Record<ShareMoment, GrowthLoop>;
// The loop of the link a moment's card carries.
export const momentLoop = (moment: ShareMoment): GrowthLoop => MOMENT_LOOP[moment];

// share_shown and share_done (docs/123, docs/29): which button was shown or used, and where to.
export const SHARE_TARGETS = ['story', 'chat'] as const;
export const shareFields = {
  button: z.enum([...GROWTH_LOOPS]),
  target: z.enum(SHARE_TARGETS).optional(),
};
