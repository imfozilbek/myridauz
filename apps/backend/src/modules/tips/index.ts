import type { Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import { notifyMass } from '../notifications';
import { usableBonus } from '../wallet';
import { sendTips as runTips } from './application/send-tips';
import { d1ForgetTips, d1Tips, d1TipsOff } from './infrastructure/d1-tips';
import { d1TipResults, type TipResult } from './infrastructure/d1-tip-results';
import { tipMessage } from './infrastructure/tip-message';

export { TIPS_OFF } from './infrastructure/tip-message';
export type { TipResult } from './infrastructure/d1-tip-results';

// The Cron job, once an hour (G70a, docs/232): the tips of a step. They read the tables of many
// modules: without D1 (tests of other modules, local runs) there are none.
export async function sendTips(env: Bindings, now: number): Promise<void> {
  if (!env.DB) return;
  const brand = brandOf(env);
  await runTips({
    ...d1Tips(env.DB),
    bonus: (driverId) => usableBonus(env, driverId),
    // A tip changes nothing on a screen: no open Mini App refreshes.
    send: (tips) =>
      notifyMass(
        env,
        tips.map((tip) => tipMessage(brand, tip)),
        [],
      ),
    now: () => now,
  });
}

// «Kerak emas» under a tip: no more tips for the person (docs/232).
export async function tipsOff(env: Bindings, userId: number): Promise<void> {
  if (env.DB) await d1TipsOff(env.DB, userId, Date.now());
}

// A deleted account takes its tips with it (docs/30).
export async function forgetTips(env: Bindings, userId: number): Promise<void> {
  if (env.DB) await d1ForgetTips(env.DB, userId);
}

// «Rost»: the tips since a moment and how many worked.
export const tipResults = async (env: Bindings, since: number): Promise<TipResult[]> =>
  env.DB ? d1TipResults(env.DB, since) : [];
