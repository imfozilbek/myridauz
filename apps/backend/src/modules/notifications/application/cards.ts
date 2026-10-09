import type { NotificationJob } from './job';

type BotName = NotificationJob['bot'];

// A live card (G68, docs/122 rule 1): one message per thing a person follows, edited without sound
// when the thing changes. The text has HTML marks: bold, quote, monospace.
export type Card = {
  readonly bot: BotName;
  readonly chatId: number;
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
};

// A short news under its card, with sound when the person has something to do (rule 2).
export type Ring = {
  readonly bot: BotName;
  readonly chatId: number;
  readonly text: string;
  readonly markup?: object;
  // The card it answers; none: the ring stands alone.
  readonly card?: string;
  // No sound: the night, the road, nothing to do now (rules 2, 3). The caller knows which.
  readonly quiet: boolean;
};

export type CardRow = { readonly messageId: number; readonly hash: string; readonly pinned: boolean };

export type CardStore = {
  readonly find: (bot: BotName, chatId: number, key: string) => Promise<CardRow | null>;
  readonly save: (bot: BotName, chatId: number, key: string, row: CardRow, now: number) => Promise<void>;
};

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
export async function cardJob(store: CardStore, card: Card): Promise<NotificationJob | null> {
  const hash = hashOf(card);
  const row = await store.find(card.bot, card.chatId, card.key);
  if (card.editOnly && !row) return null;
  const pinned = card.pin === undefined || card.pin === row?.pinned;
  if (row && row.hash === hash && pinned) return null;
  return {
    bot: card.bot,
    chatId: card.chatId,
    text: card.footer ? `${card.text}\n${card.footer}` : card.text,
    html: true,
    ...(row || !card.loud ? { silent: true } : {}),
    ...(card.markup ? { markup: card.markup } : {}),
    ...(row ? { edit: row.messageId } : {}),
    ...(!row && card.answers ? { replyCard: card.answers } : {}),
    after: {
      type: 'card',
      key: card.key,
      hash,
      ...(card.pin === undefined ? {} : { pin: card.pin }),
      ...(card.editOnly ? { editOnly: true } : {}),
    },
  };
}

export const ringJob = (ring: Ring): NotificationJob => ({
  bot: ring.bot,
  chatId: ring.chatId,
  text: ring.text,
  html: true,
  ...(ring.quiet ? { silent: true } : {}),
  ...(ring.markup ? { markup: ring.markup } : {}),
  ...(ring.card ? { replyCard: ring.card } : {}),
});
