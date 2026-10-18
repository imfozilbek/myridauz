import type { NotificationJob } from './job';

// Telegram lets a bot send about 30 messages a second (core.telegram.org/bots/faq). Many messages at
// once take 20 of them: the answers to people's own steps always find room (G85 T2, docs/122).
export const MASS_PER_SECOND = 20;
// A channel takes about 20 posts a minute; Rida sends 18 new posts a minute at most, the next ones
// wait for a later minute (G85 T7). Edits and deletes of posts go at once.
export const CHANNEL_PER_MINUTE = 18;
export const SECOND_MS = 1000;

// A channel is "@username" or a negative chat id; a person is a positive one (docs/15).
export const isChannel = (chatId: NotificationJob['chatId']) => typeof chatId === 'string' || chatId < 0;

// The clock of a bot's mass messages: the moment its next one may go. A message waits whole seconds
// (rounded down): MASS_PER_SECOND of them share one second, the next ones the second after.
export function paceAfter(
  clock: Map<NotificationJob['bot'], number>,
  bot: NotificationJob['bot'],
  now: number,
) {
  const at = Math.max(clock.get(bot) ?? 0, now);
  clock.set(bot, at + SECOND_MS / MASS_PER_SECOND);
  return Math.floor((at - now) / SECOND_MS);
}

// Queues hold a message at most 12 hours (developers.cloudflare.com/queues).
const MAX_DELAY_SECONDS = 43_200;
// Whole seconds until a moment; a moment passed is now; never longer than the queue holds.
export const secondsUntil = (at: number, now: number) =>
  Math.min(MAX_DELAY_SECONDS, Math.max(0, Math.ceil((at - now) / SECOND_MS)));

// A plain message to a person joins another one only when nothing else rides on it: no buttons, no
// edit, no card, no picture. Channel posts stay apart (docs/15).
const plain = (job: NotificationJob) =>
  !isChannel(job.chatId) &&
  !job.markup &&
  job.edit === undefined &&
  !job.after &&
  !job.replyCard &&
  !job.replyTo &&
  !job.preview;
const sameChat = (one: NotificationJob, other: NotificationJob) =>
  one.bot === other.bot && one.chatId === other.chatId;
const cardKey = (job: NotificationJob) => (job.after?.type === 'card' ? job.after.key : null);

// Events of one person at the same moment give one message (G85 T5, docs/122): the last state of a
// live card wins over the earlier ones, and plain texts to the same chat go as one message.
export function coalesce(jobs: readonly NotificationJob[]): NotificationJob[] {
  const kept: NotificationJob[] = [];
  for (const job of jobs) {
    const key = cardKey(job);
    const card = key ? kept.findIndex((one) => sameChat(one, job) && cardKey(one) === key) : -1;
    if (card >= 0) {
      kept[card] = job;
      continue;
    }
    const text = plain(job) ? kept.findIndex((one) => sameChat(one, job) && plain(one)) : -1;
    const earlier = kept[text];
    if (earlier && earlier.html === job.html) {
      const silent = Boolean(earlier.silent && job.silent);
      kept[text] = { ...earlier, text: `${earlier.text}\n\n${job.text}`, silent };
      continue;
    }
    kept.push(job);
  }
  return kept;
}
