import { TIP_STEPS } from '@platform/contracts';
import { botOf, isTipTime, pickTips, type TipBot } from '../domain/tip-rules';
import { windowsOf } from '../domain/tip-windows';
import type { ReadyTip, Stopped, TipsDeps } from './ports';

const idsOf = (stopped: readonly Stopped[], bot: TipBot) => [
  ...new Set(stopped.filter((one) => botOf(one.step) === bot).map((one) => one.userId)),
];

// The Cron job, once an hour (G70a, docs/232): the people who stopped on a step hear its tip,
// silently, by day only, never on the road, never when the bot may not write them.
export async function sendTips(deps: TipsDeps): Promise<void> {
  const now = deps.now();
  if (!isTipTime(now)) return;
  const reads = TIP_STEPS.flatMap((step) =>
    windowsOf(step, now).map((window) => deps.stopped(step, window, now)),
  );
  const stopped = (await Promise.all(reads)).flat();
  if (stopped.length === 0) return;
  const [passengers, drivers, road, journal] = await Promise.all([
    deps.reachable(idsOf(stopped, 'passenger'), 'passenger'),
    deps.reachable(idsOf(stopped, 'driver'), 'driver'),
    deps.onTheRoad(now),
    deps.journal([...new Set(stopped.map((one) => one.userId))]),
  ]);
  const open = stopped.filter(
    (one) => (botOf(one.step) === 'driver' ? drivers : passengers).has(one.userId) && !road.has(one.userId),
  );
  const picked = pickTips(open, journal, now);
  if (picked.length === 0) return;
  const ready: ReadyTip[] = await Promise.all(
    picked.map(async (tip) => (tip.step === 'd2' ? { ...tip, bonus: await deps.bonus(tip.userId) } : tip)),
  );
  // The journal first: a send that breaks halfway never tips the same people twice.
  await deps.record(picked.map(({ userId, step }) => ({ userId, step, sentAt: now })));
  await deps.send(ready);
}
