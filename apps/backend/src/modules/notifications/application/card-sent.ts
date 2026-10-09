import type { CardStore, ChatId } from './cards';
import type { CardSent, NotificationJob } from './job';

type BotName = NotificationJob['bot'];
type Act = (bot: BotName, chatId: ChatId, messageId: number) => Promise<void>;

// What a card does in the private chat with a bot (docs/122 rule 6): on top of it or off it, and
// a copy that came late goes away.
export type ChatOps = { readonly pin: Act; readonly unpin: Act; readonly remove: Act };

const tried = (work: Promise<void>, done: boolean, failed: boolean) =>
  work.then(
    () => done,
    () => failed,
  );

// A card reached Telegram: its id is kept, and it goes on top of the chat or off it. A new card
// claims its place first: of two news at once only one message stays (the other is deleted). A card
// sent anew after its old message could not be edited takes the old one off the top.
export async function cardSent(
  store: CardStore,
  ops: ChatOps,
  job: NotificationJob,
  sent: { readonly after: CardSent; readonly messageId: number; readonly replaced: number | null },
  now: number,
): Promise<void> {
  const { after, messageId, replaced } = sent;
  const { chatId } = job;
  const before = await store.find(job.bot, chatId, after.key);
  const fresh = job.edit === undefined && replaced === null;
  if (
    fresh &&
    !(await store.claim(job.bot, chatId, after.key, { messageId, hash: after.hash, pinned: false }, now))
  )
    return ops.remove(job.bot, chatId, messageId).catch(() => undefined);
  if (replaced !== null && before?.pinned) await tried(ops.unpin(job.bot, chatId, replaced), false, false);
  let pinned = !fresh && before?.messageId === messageId && before.pinned;
  if (after.pin === true && !pinned) pinned = await tried(ops.pin(job.bot, chatId, messageId), true, false);
  if (after.pin === false && pinned) pinned = await tried(ops.unpin(job.bot, chatId, messageId), false, true);
  await store.save(job.bot, chatId, after.key, { messageId, hash: after.hash, pinned }, now);
}
