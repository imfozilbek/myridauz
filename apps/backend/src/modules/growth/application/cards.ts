import {
  botStartLink,
  loopVia,
  type MyGrowth,
  type PreparedCard,
  type ShareMoment,
} from '@platform/contracts';
import { momentFacts, reachedMoment } from './moments';
import type { CardInput, CardMessage, GrowthDeps, Side } from './ports';

// The only moment is the driver's (owner decision 18.10.2026): its card goes from the driver app.
const SIDE: Side = 'driver';

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

// «Yoʻlovchilarimga yuborish» only for a moment the person reached: offered already or due now
// (docs/123: every praise is true). null: no such moment.
export async function momentCard(
  deps: CardDeps,
  userId: number,
  moment: ShareMoment,
  phrase: number,
): Promise<PreparedCard | null> {
  const offered = await deps.store.offered(userId);
  if (!offered.includes(moment) && (await reachedMoment(deps, userId, SIDE)) !== moment) return null;
  const { link } = await momentFacts(deps, userId, moment);
  const message = deps.message({ moment, phrase, name: (await deps.nameOf(userId)) ?? '' });
  return { prepared: await deps.prepare(SIDE, userId, message, link), link, text: message.text };
}

// The moment was shown: whatever the answer, it is not offered again (docs/123: no pressure). Only a
// moment the person reached; false: none, nothing kept.
export async function offerMoment(deps: GrowthDeps, userId: number, moment: ShareMoment) {
  if ((await reachedMoment(deps, userId, SIDE)) !== moment) return false;
  await deps.store.offer(userId, moment, deps.now());
  return true;
}

// «Sizning taʼsiringiz»: who came by the person's links, who of them rode, the QR of a driver.
// «Yana ulashish» is a card of the loop share-join (G88).
export async function myGrowth(deps: GrowthDeps, userId: number): Promise<MyGrowth> {
  const [impact, code] = await Promise.all([deps.store.impactOf(userId), deps.store.codeOf(userId)]);
  return { ...impact, qr: botStartLink(deps.passengerBot, loopVia('qr', code)) };
}
