import type { Bindings } from '../../../env';
import { recordServerEvent } from '../../analytics';
import { sendSignals, signalsOf } from '../../feed';
import type { Delivery } from '../application/deliver';
import type { NotificationJob, QueueMessage, TimedTask } from '../application/job';
import { CHANNEL_STEP_MS, coalesce, isChannel, massDelays, secondsUntil } from '../application/pace';
import { deliverNow } from './deliver-now';
import { paceOf } from './wiring';

// A few messages go straight to Telegram: each one through the queue costs operations of Queues
// (G56, docs/117). Without the queue (tests, local runs) every message is sent at once.
const DIRECT_LIMIT = 5;
const RETRY = { outcome: 'retry', afterSeconds: 5 } as const;
// One sendBatch of Queues takes at most 100 messages.
const BATCH = 100;
type Waiting = { readonly body: NotificationJob; readonly delaySeconds: number };
type Bot = NotificationJob['bot'];

// Messages and tasks into the queue, counted as its operations for the dashboard (G85 T1).
export async function enqueue(env: Bindings, items: readonly MessageSendRequest<QueueMessage>[]) {
  const queue = env.NOTIFICATIONS;
  if (!queue || items.length === 0) return;
  for (let start = 0; start < items.length; start += BATCH)
    await queue.sendBatch(items.slice(start, start + BATCH));
  recordServerEvent(env, { name: 'queue_ops', source: 'write', count: items.length });
}

// Sends the messages that may go now, one by one; a bot that waits (T4) keeps its messages for the
// queue, also the ones after the 429 that made it wait.
async function sendDirect(env: Bindings, ready: readonly Waiting[], paused: Map<Bot, number>) {
  const later: Waiting[] = [];
  for (const item of ready) {
    const now = Date.now();
    const until = paused.get(item.body.bot) ?? 0;
    if (until > now) {
      later.push({ body: item.body, delaySeconds: secondsUntil(until, now) });
      continue;
    }
    const delivery: Delivery = await deliverNow(env, item.body).catch(() => RETRY);
    if (delivery.outcome !== 'retry') continue;
    if (delivery.limited) paused.set(item.body.bot, now + delivery.afterSeconds * 1000);
    later.push({ body: item.body, delaySeconds: delivery.afterSeconds });
  }
  return later;
}

// Messages with their waits: a few that wait nothing go now, the rest through the queue.
async function dispatch(env: Bindings, items: readonly Waiting[]) {
  if (!env.NOTIFICATIONS) {
    for (const { body } of items) await deliverNow(env, body);
    return;
  }
  const paused = new Map(await paceOf(env).pauses(Date.now()));
  const now = items.filter((item) => item.delaySeconds === 0);
  const direct = now.length <= DIRECT_LIMIT ? now : [];
  const queued = items.filter((item) => !direct.includes(item));
  const later = await sendDirect(env, direct, paused);
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
  await dispatch(
    env,
    coalesce(jobs).map((body) => ({ body, delaySeconds: 0 })),
  );
}

// Many messages at once (subscriptions, posts in channels, reminders, the waitlist): an even pace,
// MASS_PER_SECOND a bot, and 18 posts a minute in one channel (G85 T2, T7, docs/122).
export async function notifyMass(
  env: Bindings,
  jobs: readonly NotificationJob[],
  signalled: readonly NotificationJob[] = jobs,
): Promise<void> {
  if (jobs.length === 0) return;
  await sendSignals(env, signalsOf(signalled));
  const joined = coalesce(jobs);
  const delays = massDelays(joined.filter((job) => !isChannel(job.chatId)));
  const pace = paceOf(env);
  const now = Date.now();
  const items: Waiting[] = [];
  for (const body of joined) {
    const slot = isChannel(body.chatId) ? await pace.slot(String(body.chatId), now, CHANNEL_STEP_MS) : null;
    const delaySeconds = slot === null ? (delays.shift() ?? 0) : secondsUntil(slot, now);
    items.push({ body, delaySeconds });
  }
  await dispatch(env, items);
}

// Tasks that wait for their moment in the queue (G85 R3). Without the queue they run at once.
export async function scheduleTasks(
  env: Bindings,
  tasks: readonly { readonly task: TimedTask; readonly at: number }[],
  runNow: (task: TimedTask) => Promise<void>,
): Promise<void> {
  if (!env.NOTIFICATIONS) {
    for (const { task } of tasks) await runNow(task);
    return;
  }
  const now = Date.now();
  await enqueue(
    env,
    tasks.map(({ task, at }) => ({ body: task, delaySeconds: secondsUntil(at, now) })),
  );
}
