import type { Bindings } from '../../env';
import { teamMembers } from '../team';
import { deliver, type Tokens } from './application/deliver';
import type { AfterSentHandler, NotificationJob } from './application/job';

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

// Bot messages go through the queue (docs/03): a slow or busy Telegram never slows the API.
// Without the queue (tests, local runs) they are sent at once.
export async function notify(env: Bindings, jobs: readonly NotificationJob[]): Promise<void> {
  if (jobs.length === 0) return;
  if (env.NOTIFICATIONS) {
    await env.NOTIFICATIONS.sendBatch(jobs.map((body) => ({ body })));
    return;
  }
  for (const job of jobs) await deliverNow(env, job);
}

// A message for every team member through the admin bot (docs/02).
export async function notifyTeam(env: Bindings, text: string): Promise<void> {
  const team = await teamMembers(env);
  await notify(
    env,
    team.map((member) => ({ bot: 'admin' as const, chatId: member.id, text })),
  );
}

// The queue consumer (brands/<brand>/wrangler.toml): Telegram asks to wait, the message waits.
export async function consumeNotifications(
  batch: MessageBatch<NotificationJob>,
  env: Bindings,
): Promise<void> {
  for (const message of batch.messages) {
    const delivery = await deliverNow(env, message.body);
    if (delivery.outcome === 'retry') message.retry({ delaySeconds: delivery.afterSeconds });
    else message.ack();
  }
}
