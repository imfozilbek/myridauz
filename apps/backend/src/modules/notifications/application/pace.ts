import type { NotificationJob } from './job';

// Telegram lets a bot send about 30 messages a second (core.telegram.org/bots/faq). The regulator of
// G86 (docs/122): the answers to people's own steps go up to 25 a second a bot, many messages at once
// up to 20. The first 5 answers of a second fit beside the mass ones; more answers in one second make
// the mass messages of the bot wait to its end (fast lane first), so a bot stays near 25 a second.
export const FAST_PER_SECOND = 25;
export const MASS_PER_SECOND = 20;
const FAST_RESERVE = FAST_PER_SECOND - MASS_PER_SECOND;
// A channel takes about 20 posts a minute; Rida sends 18 new posts a minute at most, the next ones
// wait for a later minute (G85 T7). Edits and deletes of posts go at once.
export const CHANNEL_PER_MINUTE = 18;
export const SECOND_MS = 1000;

// A channel is "@username" or a negative chat id; a person is a positive one (docs/15).
export const isChannel = (chatId: NotificationJob['chatId']) => typeof chatId === 'string' || chatId < 0;

type Bot = NotificationJob['bot'];
// The seconds of each bot and how many messages each one took (G86 T3).
export type Seconds = Map<Bot, Map<number, number>>;
// A wait of a whole bot (429, G85 T4) or only of its mass messages (G86 T3).
export type PauseKey = Bot | `${Bot}:mass`;
export const massKey = (bot: Bot): PauseKey => `${bot}:mass`;
// The moment a message may go: the wait of its bot, and for a mass one the wait of the mass lane too.
export const waitOf = (paused: ReadonlyMap<PauseKey, number>, job: NotificationJob): number =>
  Math.max(paused.get(job.bot) ?? 0, job.mass ? (paused.get(massKey(job.bot)) ?? 0) : 0);

// The first second from now with a free place under the lane's cap: the whole seconds to wait.
export function takeSecond(seconds: Seconds, bot: Bot, now: number, cap: number): number {
  const used = seconds.get(bot) ?? new Map<number, number>();
  seconds.set(bot, used);
  const first = Math.floor(now / SECOND_MS);
  for (const second of used.keys()) if (second < first) used.delete(second);
  let second = first;
  while ((used.get(second) ?? 0) >= cap) second += 1;
  used.set(second, (used.get(second) ?? 0) + 1);
  return second - first;
}

// The gate of the moment a message goes (G86 T8): what each bot sent in the last second, the answers
// and the mass ones together, as Telegram counts. A mass message goes while there are fewer than
// MASS_PER_SECOND, an answer fewer than FAST_PER_SECOND: it gets its place, or null and waits. A
// place counts from the call until a second after Telegram answered: a call the network held back
// reaches Telegram later than it left (30 at once and 429 on the stand).
export type Place = { at: number };
export type Sent = Map<Bot, Place[]>;
export function admit(sent: Sent, job: NotificationJob, now: number): Place | null {
  const cap = job.mass ? MASS_PER_SECOND : FAST_PER_SECOND;
  const recent = (sent.get(job.bot) ?? []).filter((place) => place.at > now - SECOND_MS);
  sent.set(job.bot, recent);
  if (recent.length >= cap) return null;
  const place = { at: Number.POSITIVE_INFINITY };
  recent.push(place);
  return place;
}

// The answers to people: their waits, and until when the mass messages of a bot wait for them.
export function answerWaits(seconds: Seconds, jobs: readonly NotificationJob[], now: number) {
  const massUntil = new Map<Bot, number>();
  const first = Math.floor(now / SECOND_MS);
  const waits = jobs.map((job) => {
    if (isChannel(job.chatId)) return 0;
    const wait = takeSecond(seconds, job.bot, now, FAST_PER_SECOND);
    const taken = seconds.get(job.bot)?.get(first + wait) ?? 0;
    if (taken > FAST_RESERVE) massUntil.set(job.bot, (first + wait + 1) * SECOND_MS);
    return wait;
  });
  return { waits, massUntil };
}

// Queues hold a message at most 12 hours (developers.cloudflare.com/queues).
const MAX_DELAY_SECONDS = 43_200;
// Whole seconds until a moment; a moment passed is now; never longer than the queue holds.
export const secondsUntil = (at: number, now: number) =>
  Math.min(MAX_DELAY_SECONDS, Math.max(0, Math.ceil((at - now) / SECOND_MS)));

// A card edited a moment ago waits for its next second (G86 T3, T5).
export const cardWait = (body: NotificationJob, now: number) =>
  body.after?.type === 'card' && body.after.notBefore !== undefined
    ? secondsUntil(body.after.notBefore, now)
    : 0;

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
