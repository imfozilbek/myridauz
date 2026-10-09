import type { CardStore } from './cards';
import type { CardSent, NotificationJob } from './job';

type BotName = NotificationJob['bot'];

// Pins of a private chat with a bot (docs/122 rule 6); a pin that failed leaves the card unpinned.
export type Pins = {
  readonly pin: (bot: BotName, chatId: number, messageId: number) => Promise<void>;
  readonly unpin: (bot: BotName, chatId: number, messageId: number) => Promise<void>;
};

// A card reached Telegram: its id is kept, and it goes on top of the chat or off it.
export async function cardSent(
  store: CardStore,
  pins: Pins,
  job: NotificationJob,
  after: CardSent,
  messageId: number,
  now: number,
): Promise<void> {
  const chatId = Number(job.chatId);
  const before = await store.find(job.bot, chatId, after.key);
  let pinned = before?.messageId === messageId && before.pinned;
  if (after.pin === true && !pinned)
    pinned = await pins.pin(job.bot, chatId, messageId).then(
      () => true,
      () => false,
    );
  if (after.pin === false && pinned)
    pinned = await pins.unpin(job.bot, chatId, messageId).then(
      () => false,
      () => true,
    );
  await store.save(job.bot, chatId, after.key, { messageId, hash: after.hash, pinned }, now);
}
