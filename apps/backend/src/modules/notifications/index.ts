import type { Bindings } from '../../env';
import { sendSignals, signalsOf } from '../feed';
import { teamMembers } from '../team';
import { deliver, type Tokens } from './application/deliver';
import { keepDead } from './application/dead-letter';
import type { AfterSentHandler, NotificationJob } from './application/job';
import { recordServerEvent } from '../analytics';

export type { NotificationJob } from './application/job';

const tokensOf = (env: Bindings): Tokens => ({
  passenger: env.PASSENGER_BOT_TOKEN,
  driver: env.DRIVER_BOT_TOKEN,
  admin: env.ADMIN_BOT_TOKEN,
});
const send = (input: string, init?: RequestInit) => fetch(input, init);

// What to do once a message has its id; set by the app, which knows every module (app.ts).
let afterSent: AfterSentHandler<Bindings> = async () => undefined;
export const handleAfterSent = (handler: AfterSentHandler<Bindings>) => void (afterSent = handler);

async function deliverNow(env: Bindings, job: NotificationJob) {
  const delivery = await deliver(send, tokensOf(env), job);
  if (delivery.outcome === 'sent' && job.after && delivery.messageId !== null)
    await afterSent(env, job.after, delivery.messageId);
  return delivery;
}

// A few messages go straight to Telegram: each one through the queue costs 3 of the free
// operations of Queues a day (G56, docs/117). A message Telegram asks to wait for, and a big batch
// (the subscribers of a route), go through the queue at Telegram's pace (docs/03). Without the
// queue (tests, local runs) every message is sent at once.
// The same moment the open Mini Apps of these people refresh their screens (docs/64, G19).
const DIRECT_LIMIT = 5;
const RETRY = { outcome: 'retry', afterSeconds: 5 } as const;

export async function notify(env: Bindings, jobs: readonly NotificationJob[]): Promise<void> {
  if (jobs.length === 0) return;
  await sendSignals(env, signalsOf(jobs));
  const queue = env.NOTIFICATIONS;
  if (queue && jobs.length > DIRECT_LIMIT) {
    await queue.sendBatch(jobs.map((body) => ({ body })));
    return;
  }
  const later: MessageSendRequest<NotificationJob>[] = [];
  for (const body of jobs) {
    const delivery = queue ? await deliverNow(env, body).catch(() => RETRY) : await deliverNow(env, body);
    if (delivery.outcome === 'retry') later.push({ body, delaySeconds: delivery.afterSeconds });
  }
  if (queue && later.length > 0) await queue.sendBatch(later);
}

// A message for every team member through the admin bot (docs/02).
export async function notifyTeam(env: Bindings, text: string, markup?: object): Promise<void> {
  const team = await teamMembers(env);
  await notify(
    env,
    team.map((member) => ({ bot: 'admin' as const, chatId: member.id, text, ...(markup ? { markup } : {}) })),
  );
}

// The tries of one message: max_retries of the queue (brands/<brand>/wrangler.toml).
export const MAX_ATTEMPTS = 5;

// The queue consumer (brands/<brand>/wrangler.toml): Telegram asks to wait, the message waits. After
// the last try the message goes to the dead letters, never lost silently (G42, docs/65 D).
export async function consumeNotifications(
  batch: MessageBatch<NotificationJob>,
  env: Bindings,
): Promise<void> {
  for (const message of batch.messages) {
    const delivery = await deliverNow(env, message.body).catch(() => RETRY);
    if (delivery.outcome !== 'retry') message.ack();
    else if (message.attempts < MAX_ATTEMPTS) message.retry({ delaySeconds: delivery.afterSeconds });
    else {
      await keepDead(env.DB, message.body, 'telegram', Date.now());
      recordServerEvent(env, { name: 'server_error', code: 'notification_dead' });
      message.ack();
    }
  }
}
