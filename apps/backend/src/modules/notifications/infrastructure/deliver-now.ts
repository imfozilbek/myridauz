import type { Bindings } from '../../../env';
import { recordServerEvent } from '../../analytics';
import { cardSent } from '../application/card-sent';
import { deliver, type Delivery } from '../application/deliver';
import type { AfterSentHandler, NotificationJob } from '../application/job';
import { cardsOf, opsOf, paceOf, send, tokensOf } from './wiring';

const SECOND_MS = 1000;

// What to do once a message has its id; set by the app, which knows every module (app.ts).
let afterSent: AfterSentHandler<Bindings> = async () => undefined;
export const handleAfterSent = (handler: AfterSentHandler<Bindings>) => void (afterSent = handler);

// A ring answers its card: the card's id is found now, when the card is surely sent before it.
async function withReply(env: Bindings, job: NotificationJob): Promise<NotificationJob> {
  if (!job.replyCard) return job;
  const card = await cardsOf(env).find(job.bot, job.chatId, job.replyCard);
  return card ? { ...job, replyTo: card.messageId } : job;
}

const withoutEdit = (job: NotificationJob): NotificationJob =>
  Object.fromEntries(Object.entries(job).filter(([field]) => field !== 'edit')) as NotificationJob;

// One call to Telegram, counted by bot for the dashboard (G85 T1, docs/56). A 429 makes the whole
// bot wait (T4): the next messages of the bot wait in the queue, not each one for itself.
async function tryOnce(env: Bindings, job: NotificationJob): Promise<Delivery> {
  const delivery = await deliver(send, tokensOf(env), job);
  const limited = delivery.outcome === 'retry' && delivery.limited === true;
  recordServerEvent(env, { name: 'bot_send', source: job.bot, code: limited ? 'limited' : delivery.outcome });
  if (limited) await paceOf(env).pause(job.bot, Date.now() + delivery.afterSeconds * SECOND_MS);
  return delivery;
}

export async function deliverNow(env: Bindings, job: NotificationJob): Promise<Delivery> {
  let sent = await withReply(env, job);
  let delivery = await tryOnce(env, sent);
  const card = sent.after?.type === 'card' ? sent.after : null;
  let replaced: number | null = null;
  // The person deleted the card, or it is too old to edit: a new card takes its place.
  if (delivery.outcome === 'gone' && card && !card.editOnly) {
    replaced = sent.edit ?? null;
    sent = withoutEdit(sent);
    delivery = await tryOnce(env, sent);
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
