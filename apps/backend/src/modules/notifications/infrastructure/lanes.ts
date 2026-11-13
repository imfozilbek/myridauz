import type { Bindings } from '../../../env';
import { sendSignals, signalsOf } from '../../feed';
import type { Delivery } from '../application/deliver';
import type { NotificationJob } from '../application/job';
import {
  answerWaits,
  CHANNEL_PER_MINUTE,
  cardWait,
  coalesce,
  isChannel,
  massKey,
  MASS_PER_SECOND,
  type PauseKey,
  SECOND_MS,
  secondsUntil,
  takeSecond,
  waitOf,
  type Seconds,
} from '../application/pace';
import { deliverNow } from './deliver-now';
import { enqueue } from './enqueue';
import { paceOf } from './wiring';

// A few messages go straight to Telegram: each one through the queue costs operations of Queues
// (G56, docs/117). Without the queue (tests, local runs) every message is sent at once.
const DIRECT_LIMIT = 5;
const RETRY = { outcome: 'retry', afterSeconds: 5 } as const;
// The waits of the bots are read from D1 at most this often by one Worker (G85 T4).
const PAUSES_FRESH_MS = 5000;
type Waiting = { readonly body: NotificationJob; readonly delaySeconds: number };

// Kept by the Worker between requests: the seconds of each bot, so a loop that tells many people one
// by one keeps the pace too (T2, G86 T3), and the waits of the bots read lately (T4).
type Clock = { readonly fast: Seconds; readonly mass: Seconds };
const clocks = new WeakMap<Bindings, Clock>();
const pauses = new WeakMap<Bindings, { readonly at: number; readonly paused: Map<PauseKey, number> }>();
function clockOf(env: Bindings): Clock {
  const kept = clocks.get(env);
  if (kept) return kept;
  const clock: Clock = { fast: new Map(), mass: new Map() };
  clocks.set(env, clock);
  return clock;
}

async function pausesOf(env: Bindings, now: number): Promise<Map<PauseKey, number>> {
  const kept = pauses.get(env);
  if (kept && now - kept.at < PAUSES_FRESH_MS) return kept.paused;
  const paused = new Map(await paceOf(env).pauses(now));
  pauses.set(env, { at: now, paused });
  return paused;
}

// Sends the messages that may go now, one by one; a bot that waits (T4) keeps its messages for the
// queue, also the ones after the 429 that made it wait.
async function sendDirect(env: Bindings, ready: readonly Waiting[], paused: Map<PauseKey, number>) {
  const later: Waiting[] = [];
  for (const item of ready) {
    const now = Date.now();
    const until = waitOf(paused, item.body);
    if (until > now) {
      later.push({ body: item.body, delaySeconds: secondsUntil(until, now) });
      continue;
    }
    const delivery: Delivery = await deliverNow(env, item.body).catch(() => RETRY);
    if (delivery.outcome !== 'retry') continue;
    if (delivery.limited) paused.set(item.body.bot, now + delivery.afterSeconds * SECOND_MS);
    later.push({ body: item.body, delaySeconds: secondsUntil(now + delivery.afterSeconds * SECOND_MS, now) });
  }
  return later;
}

// Messages with their waits: a few that wait nothing go now, the rest through the queue.
async function dispatch(env: Bindings, waits: readonly Waiting[]) {
  const at = Date.now();
  const items = waits.map((item) => ({
    ...item,
    delaySeconds: Math.max(item.delaySeconds, cardWait(item.body, at)),
  }));
  if (!env.NOTIFICATIONS) {
    for (const { body } of items) await deliverNow(env, body);
    return;
  }
  const now = items.filter((item) => item.delaySeconds === 0);
  const direct = now.length <= DIRECT_LIMIT ? now : [];
  const queued = items.filter((item) => !direct.includes(item));
  const later = direct.length > 0 ? await sendDirect(env, direct, await pausesOf(env, Date.now())) : [];
  await enqueue(env, [...queued, ...later]);
}

// The answer to a person's own step (a booking, the chat, a decision): at once and first (G85 T2).
// signalled: whose open Mini App refreshes; a quiet card alone (one's own step) refreshes nobody.
export async function notify(
  env: Bindings,
  jobs: readonly NotificationJob[],
  signalled: readonly NotificationJob[] = jobs,
): Promise<void> {
  if (jobs.length === 0) return;
  await sendSignals(env, signalsOf(signalled));
  // Up to 25 a second a bot; a crowd of answers makes the mass messages wait (G86 T3).
  const bodies = coalesce(jobs);
  const { waits, massUntil } = answerWaits(clockOf(env).fast, bodies, Date.now());
  for (const [bot, until] of massUntil) await paceOf(env).pause(massKey(bot), until);
  await dispatch(
    env,
    bodies.map((body, index) => ({ body, delaySeconds: waits[index] ?? 0 })),
  );
}

// Many messages at once (subscriptions, posts in channels, reminders, the waitlist): an even pace,
// MASS_PER_SECOND a bot, and 18 new posts a minute in one channel (G85 T2, T7, docs/122).
export async function notifyMass(
  env: Bindings,
  jobs: readonly NotificationJob[],
  signalled: readonly NotificationJob[] = jobs,
): Promise<void> {
  if (jobs.length === 0) return;
  await sendSignals(env, signalsOf(signalled));
  const clock = clockOf(env).mass;
  const pace = paceOf(env);
  const now = Date.now();
  const items: Waiting[] = [];
  for (const job of coalesce(jobs)) {
    const body = { ...job, mass: true };
    const channel = isChannel(body.chatId);
    const post = channel && body.edit === undefined;
    const slot = post ? await pace.slot(String(body.chatId), now, CHANNEL_PER_MINUTE) : null;
    const delaySeconds =
      slot !== null
        ? secondsUntil(slot, now)
        : channel
          ? 0
          : takeSecond(clock, body.bot, now, MASS_PER_SECOND);
    items.push({ body, delaySeconds });
  }
  await dispatch(env, items);
}
