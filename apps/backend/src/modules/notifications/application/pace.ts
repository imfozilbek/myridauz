import type { NotificationJob } from './job';

// Telegram lets a bot send about 30 messages a second (core.telegram.org/bots/faq). Many messages at
// once take 20 of them: the answers to people's own steps always find room (G85 T2, docs/122).
export const MASS_PER_SECOND = 20;
// A channel takes about 20 posts a minute; Rida keeps to 18, one each 60 / 18 seconds (G85 T7).
export const CHANNEL_STEP_MS = 60_000 / 18;
export const SECOND_MS = 1000;

// A channel is "@username" or a negative chat id; a person is a positive one (docs/15).
export const isChannel = (chatId: NotificationJob['chatId']) => typeof chatId === 'string' || chatId < 0;

// The wait of each message of a big batch: each bot sends MASS_PER_SECOND of them a second.
export function massDelays(jobs: readonly NotificationJob[]): number[] {
  const sent = new Map<NotificationJob['bot'], number>();
  return jobs.map((job) => {
    const index = sent.get(job.bot) ?? 0;
    sent.set(job.bot, index + 1);
    return Math.floor(index / MASS_PER_SECOND);
  });
}

// Whole seconds until a moment; a moment passed is now.
export const secondsUntil = (at: number, now: number) => Math.max(0, Math.ceil((at - now) / SECOND_MS));

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
