import type { Bindings } from '../../../env';
import { recordServerEvent } from '../../analytics';
import { keepDead } from '../application/dead-letter';
import type { Delivery } from '../application/deliver';
import type { QueueMessage, TimedTask } from '../application/job';
import { SECOND_MS, secondsUntil } from '../application/pace';
import { deliverNow } from './deliver-now';
import { enqueue } from './lanes';
import { paceOf } from './wiring';

// The tries of one message: max_retries of the queue (brands/<brand>/wrangler.toml).
export const MAX_ATTEMPTS = 5;
const RETRY_SECONDS = 5;
const RETRY: Delivery = { outcome: 'retry', afterSeconds: RETRY_SECONDS };

// Who runs a timed task when its moment comes (src/index.ts, G85 R3).
type TaskRunners = Readonly<Record<TimedTask['task'], (env: Bindings, task: TimedTask) => Promise<void>>>;

// A failure is tried again later; after the last try a message goes to the dead letters, never lost
// silently (G42, docs/65 D), counted by its bot (G85 T1). A task that kept failing is counted too.
async function failed(env: Bindings, message: Message<QueueMessage>, body: QueueMessage) {
  if (message.attempts < MAX_ATTEMPTS) return message.retry({ delaySeconds: RETRY_SECONDS });
  if ('task' in body) recordServerEvent(env, { name: 'server_error', source: body.task, code: 'task_dead' });
  else {
    await keepDead(env.DB, body, 'telegram', Date.now());
    recordServerEvent(env, { name: 'server_error', source: body.bot, code: 'notification_dead' });
  }
  message.ack();
}

// The messages of a waiting bot come back spread over this many seconds, not all in its first free
// second: a crowd at once would meet the next 429 (G85 T4). The regulator of G86 replaces it.
const SPREAD_SECONDS = 30;
const spreadOf = (id: string) => [...id].reduce((sum, sign) => sum + sign.charCodeAt(0), 0) % SPREAD_SECONDS;

// The queue consumer (brands/<brand>/wrangler.toml). A bot Telegram asked to wait (429, G85 T4)
// waits as a whole: its messages go back to the queue as new ones, so waiting never uses up their
// tries; each one is let go only once its copy is in the queue. A timed task runs at its moment (R3).
export async function consumeNotifications(
  batch: MessageBatch<QueueMessage>,
  env: Bindings,
  tasks: TaskRunners,
): Promise<void> {
  const paused = new Map(await paceOf(env).pauses(Date.now()));
  const waiting: {
    readonly message: Message<QueueMessage>;
    readonly copy: MessageSendRequest<QueueMessage>;
  }[] = [];
  const wait = (message: Message<QueueMessage>, body: QueueMessage, until: number, now: number) =>
    waiting.push({
      message,
      copy: { body, delaySeconds: secondsUntil(until, now) + spreadOf(message.id ?? '') },
    });
  for (const message of batch.messages) {
    const body = message.body;
    if ('task' in body) {
      await tasks[body.task](env, body).then(
        () => message.ack(),
        () => failed(env, message, body),
      );
      continue;
    }
    const now = Date.now();
    const until = paused.get(body.bot) ?? 0;
    if (until > now) {
      wait(message, body, until, now);
      continue;
    }
    const delivery = await deliverNow(env, body).catch(() => RETRY);
    if (delivery.outcome !== 'retry') message.ack();
    else if (delivery.limited === true) {
      paused.set(body.bot, now + delivery.afterSeconds * SECOND_MS);
      wait(message, body, now + delivery.afterSeconds * SECOND_MS, now);
    } else await failed(env, message, body);
  }
  await enqueue(
    env,
    waiting.map(({ copy }) => copy),
  ).then(
    () => waiting.forEach(({ message }) => message.ack()),
    () => waiting.forEach(({ message }) => message.retry({ delaySeconds: RETRY_SECONDS })),
  );
  // Each message read is one operation, its delete after the ack another (docs/117).
  recordServerEvent(env, { name: 'queue_ops', source: 'read', count: batch.messages.length * 2 });
}
