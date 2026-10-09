import type { Bindings } from '../../../env';
import { callTelegram } from '../../../shared/telegram/telegram-api';
import type { CardStore } from '../application/cards';
import type { NewsStore } from '../application/news';
import type { ChatOps } from '../application/card-sent';
import type { Tokens } from '../application/deliver';
import type { NotificationJob } from '../application/job';
import { createMemoryCards, d1Cards } from './d1-cards';
import { createMemoryNews, d1News } from './d1-news';

export const tokensOf = (env: Bindings): Tokens => ({
  passenger: env.PASSENGER_BOT_TOKEN,
  driver: env.DRIVER_BOT_TOKEN,
  admin: env.ADMIN_BOT_TOKEN,
});
export const send = (input: string, init?: RequestInit) => fetch(input, init);

// The live cards (G68, docs/122): D1, or memory where there is none (tests, local runs).
const memoryCards = createMemoryCards();
export const cardsOf = (env: Bindings): CardStore => (env.DB ? d1Cards(env.DB) : memoryCards);
const memoryNews = createMemoryNews();
export const newsOf = (env: Bindings): NewsStore => (env.DB ? d1News(env.DB) : memoryNews);
export const opsOf = (env: Bindings): ChatOps => {
  const call = (method: string, params: object, bot: NotificationJob['bot']) =>
    callTelegram(send, tokensOf(env)[bot] ?? '', method, params);
  return {
    pin: (bot, chatId, messageId) =>
      call('pinChatMessage', { chat_id: chatId, message_id: messageId, disable_notification: true }, bot),
    unpin: (bot, chatId, messageId) =>
      call('unpinChatMessage', { chat_id: chatId, message_id: messageId }, bot),
    remove: (bot, chatId, messageId) =>
      call('deleteMessage', { chat_id: chatId, message_id: messageId }, bot),
  };
};
