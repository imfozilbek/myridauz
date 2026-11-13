import type { NotificationJob } from './job';

type BotName = NotificationJob['bot'];
// A person, or a channel as «@username»: the board of the day (G68, docs/122).
export type ChatId = number | string;

// A live card (G68, docs/122 rule 1): one message per thing a person follows, edited without sound
// when the thing changes. The text has HTML marks: bold, quote, monospace.
export type Card = {
  readonly bot: BotName;
  readonly chatId: ChatId;
  // What the card is about: «trip:<booking id>», «request:<id>», «news:<route>:<day>».
  readonly key: string;
  readonly text: string;
  // «✏️ 18:40 da yangilandi»: shown under the text, but a new time alone does not edit the card.
  readonly footer?: string;
  readonly markup?: object;
  // On top of the chat (📌) while the trip is ahead; false: taken off the top (rule 6).
  readonly pin?: boolean;
  // Its first message rings: a request the driver answers right in the bot (docs/122).
  readonly loud?: boolean;
  // The card its first message answers: a request under its trip.
  readonly answers?: string;
  // Only an edit of the message sent before: an old thing never comes as a new message.
  readonly editOnly?: boolean;
  // Another person or the clock changed it: the open Mini App refreshes too (docs/64).
  readonly refresh?: boolean;
  // A link whose big picture shows above the text: the board of the day (docs/122).
  readonly preview?: string;
  // Sent once and never edited: a summary of the day or the week (docs/122).
  readonly once?: boolean;
};

// A short news under its card, with sound when the person has something to do (rule 2).
export type Ring = {
  readonly bot: BotName;
  readonly chatId: ChatId;
  readonly text: string;
  readonly markup?: object;
  // The card it answers; none: the ring stands alone.
  readonly card?: string;
  // No sound: the night, the road, nothing to do now (rules 2, 3). The caller knows which.
  readonly quiet: boolean;
};

export type CardRow = {
  readonly messageId: number;
  readonly hash: string;
  readonly pinned: boolean;
  // G86 T5: the newest state an edit was made for, and when the card was last sent.
  readonly wanted?: string | null;
  readonly updatedAt?: number;
};

export type CardStore = {
  readonly find: (bot: BotName, chatId: ChatId, key: string) => Promise<CardRow | null>;
  readonly save: (bot: BotName, chatId: ChatId, key: string, row: CardRow, now: number) => Promise<void>;
  // The first message of a card takes its place; false: another one took it a moment before.
  readonly claim: (bot: BotName, chatId: ChatId, key: string, row: CardRow, now: number) => Promise<boolean>;
  // The newest state of a card that has a message: an older edit still waiting is not sent (G86 T5).
  readonly want: (bot: BotName, chatId: ChatId, key: string, hash: string) => Promise<void>;
};

// One person gets at most one edit of a card a second (Telegram: 1 message a second to a person).
const CARD_GAP_MS = 1000;

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const HEX = 16;

// A short mark of what the card shows (FNV-1a): the same card is not sent to Telegram again.
function hashOf(card: Card): string {
  let hash = FNV_OFFSET;
  for (const char of `${card.text}\n${JSON.stringify(card.markup ?? null)}`) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(HEX);
}

// The message that shows the card now: a new one, an edit of the old one, or nothing to do.
export async function cardJob(
  store: CardStore,
  card: Card,
  now = Date.now(),
): Promise<NotificationJob | null> {
  const hash = hashOf(card);
  const row = await store.find(card.bot, card.chatId, card.key);
  if ((card.editOnly && !row) || (card.once && row)) return null;
  const pinned = card.pin === undefined || card.pin === row?.pinned;
  if (row && row.hash === hash && pinned) return null;
  if (row) await store.want(card.bot, card.chatId, card.key, hash);
  // A card edited less than a second ago waits for its next second (G86 T3, T5).
  const notBefore = row?.updatedAt === undefined ? 0 : row.updatedAt + CARD_GAP_MS;
  return {
    bot: card.bot,
    chatId: card.chatId,
    text: card.footer ? `${card.text}\n${card.footer}` : card.text,
    html: true,
    ...(row || !card.loud ? { silent: true } : {}),
    ...(card.markup ? { markup: card.markup } : {}),
    ...(card.preview ? { preview: card.preview } : {}),
    ...(row ? { edit: row.messageId } : {}),
    ...(!row && card.answers ? { replyCard: card.answers } : {}),
    after: {
      type: 'card',
      key: card.key,
      hash,
      ...(card.pin === undefined ? {} : { pin: card.pin }),
      ...(card.editOnly ? { editOnly: true } : {}),
      ...(notBefore > now ? { notBefore } : {}),
    },
  };
}

// A queued edit of a card whose newest state is another one: a later edit shows it (G86 T5).
export const staleEdit = (job: NotificationJob, row: CardRow | null): boolean =>
  job.edit !== undefined &&
  job.after?.type === 'card' &&
  typeof row?.wanted === 'string' &&
  row.wanted !== job.after.hash;

export const ringJob = (ring: Ring): NotificationJob => ({
  bot: ring.bot,
  chatId: ring.chatId,
  text: ring.text,
  html: true,
  ...(ring.quiet ? { silent: true } : {}),
  ...(ring.markup ? { markup: ring.markup } : {}),
  ...(ring.card ? { replyCard: ring.card } : {}),
});
