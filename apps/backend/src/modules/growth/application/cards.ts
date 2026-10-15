import {
  botStartLink,
  loopVia,
  momentSide,
  type MyGrowth,
  type PreparedCard,
  type ShareMoment,
} from '@platform/contracts';
import { momentFacts, reachedMoment } from './moments';
import type { CardInput, CardMessage, GrowthDeps, Side } from './ports';

export type CardDeps = GrowthDeps & {
  readonly nameOf: (userId: number) => Promise<string | undefined>;
  readonly message: (input: CardInput) => CardMessage;
  // The bot of the app of the side keeps the message: shareMessage of that app sends it (docs/43).
  readonly prepare: (
    side: Side,
    userId: number,
    message: CardMessage,
    link: string,
  ) => Promise<string | null>;
};

// «Doʻstlarimga yuborish» only for a moment the person reached: offered already or due now
// (docs/123: every praise is true). null: no such moment.
export async function momentCard(
  deps: CardDeps,
  userId: number,
  moment: ShareMoment,
  phrase: number,
): Promise<PreparedCard | null> {
  const side = momentSide(moment);
  const offered = await deps.store.offered(userId);
  if (!offered.includes(moment) && (await reachedMoment(deps, userId, side)) !== moment) return null;
  const { link } = await momentFacts(deps, userId, moment);
  const message = deps.message({ moment, phrase, name: (await deps.nameOf(userId)) ?? '' });
  return { prepared: await deps.prepare(side, userId, message, link), link };
}

// The moment was shown: whatever the answer, it is not offered again (docs/123: no pressure).
export const offerMoment = (deps: GrowthDeps, userId: number, moment: ShareMoment) =>
  deps.store.offer(userId, moment, deps.now());

// «Sizning taʼsiringiz»: who came by the person's links, who of them rode, the link to share again.
export async function myGrowth(deps: GrowthDeps, userId: number): Promise<MyGrowth> {
  const [impact, code] = await Promise.all([deps.store.impactOf(userId), deps.store.codeOf(userId)]);
  const link = (loop: 'share-join' | 'qr') => botStartLink(deps.passengerBot, loopVia(loop, code));
  return { ...impact, link: link('share-join'), qr: link('qr') };
}
