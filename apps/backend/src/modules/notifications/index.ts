import { isQuietTime } from '@platform/contracts';
import type { Bindings } from '../../env';
import { sendSignals, signalsOf } from '../feed';
import { teamMembers } from '../team';
import { deliver, type Delivery } from './application/deliver';
import { keepDead } from './application/dead-letter';
import type { AfterSentHandler, NotificationJob } from './application/job';
import { cardJob, ringJob, type Card, type Ring } from './application/cards';
import { cardSent } from './application/card-sent';
import { newsCard, type News } from './application/news';
import { cardsOf, newsOf, opsOf, send, tokensOf } from './infrastructure/wiring';
import { recordServerEvent } from '../analytics';

export type { NotificationJob } from './application/job';
export type { Card, Ring } from './application/cards';
export type { News, NewsLine } from './application/news';
export { forgetCards, forgetOldCards } from './infrastructure/d1-cards';

// What to do once a message has its id; set by the app, which knows every module (app.ts).
let afterSent: AfterSentHandler<Bindings> = async () => undefined;
export const handleAfterSent = (handler: AfterSentHandler<Bindings>) => void (afterSent = handler);

// A ring answers its card: the card's id is found now, when the card is surely sent before it.
async function withReply(env: Bindings, job: NotificationJob): Promise<NotificationJob> {
  if (!job.replyCard) return job;
  const card = await cardsOf(env).find(job.bot, Number(job.chatId), job.replyCard);
  return card ? { ...job, replyTo: card.messageId } : job;
}

const withoutEdit = (job: NotificationJob): NotificationJob =>
  Object.fromEntries(Object.entries(job).filter(([field]) => field !== 'edit')) as NotificationJob;

async function deliverNow(env: Bindings, job: NotificationJob): Promise<Delivery> {
  let sent = await withReply(env, job);
  let delivery = await deliver(send, tokensOf(env), sent);
  const card = sent.after?.type === 'card' ? sent.after : null;
  let replaced: number | null = null;
  // The person deleted the card, or it is too old to edit: a new card takes its place.
  if (delivery.outcome === 'gone' && card && !card.editOnly) {
    replaced = sent.edit ?? null;
    sent = withoutEdit(sent);
    delivery = await deliver(send, tokensOf(env), sent);
  }
  if (delivery.outcome !== 'sent') return delivery;
  // An edit keeps the id of the message it changed.
  const messageId = sent.edit ?? delivery.messageId;
  // The message is in Telegram already: a failed bookkeeping must not send it once more.
  if (card && messageId !== null)
    await cardSent(cardsOf(env), opsOf(env), sent, { after: card, messageId, replaced }, Date.now()).catch(
      (error: unknown) => console.warn(JSON.stringify({ event: 'card_sent_failed', message: String(error) })),
    );
  else if (sent.after?.type === 'channelPost' && delivery.messageId !== null)
    await afterSent(env, sent.after, delivery.messageId);
  return delivery;
}

// A few messages go straight to Telegram: each one through the queue costs 3 of the free
// operations of Queues a day (G56, docs/117). A message Telegram asks to wait for, and a big batch
// (the subscribers of a route), go through the queue at Telegram's pace (docs/03). Without the
// queue (tests, local runs) every message is sent at once.
// The same moment the open Mini Apps of these people refresh their screens (docs/64, G19).
const DIRECT_LIMIT = 5;
const RETRY = { outcome: 'retry', afterSeconds: 5 } as const;

// signalled: whose open Mini App refreshes; a quiet card alone (one's own step) refreshes nobody.
export async function notify(
  env: Bindings,
  jobs: readonly NotificationJob[],
  signalled: readonly NotificationJob[] = jobs,
): Promise<void> {
  if (jobs.length === 0) return;
  await sendSignals(env, signalsOf(signalled));
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

// Live cards and their rings (G68, docs/122): a card is sent, edited or left as it is; a ring
// comes after its card, so it can answer it.
export async function showCards(env: Bindings, cards: readonly Card[], rings: readonly Ring[] = []) {
  const store = cardsOf(env);
  const changed = await Promise.all(cards.map(async (card) => ({ card, job: await cardJob(store, card) })));
  const jobs = changed.flatMap(({ job }) => (job ? [job] : []));
  // A news card refreshes the open Mini App even when its message did not change or is not there.
  const news = changed.flatMap(({ card, job }) =>
    card.loud || card.refresh ? [job ?? { bot: card.bot, chatId: card.chatId, text: '' }] : [],
  );
  const ringing = rings.map(ringJob);
  await notify(env, [...jobs, ...ringing], [...news, ...ringing]);
}

// The news of a route in its card of the day (docs/122 rule 4): the first one rings, unless it is
// night; the next ones of the day edit it without sound.
export async function showNews(env: Bindings, news: News): Promise<void> {
  const now = Date.now();
  await showCards(env, [await newsCard(newsOf(env), news, now, isQuietTime(now))]);
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
