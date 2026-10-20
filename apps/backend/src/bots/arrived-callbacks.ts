import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { answerArrived, ARRIVED_PREFIX, ridingOf } from '../modules/bookings';
import { isBlocked } from '../modules/users';
import { botToken } from '../shared/telegram/bot-config';
import { callTelegram } from '../shared/telegram/telegram-api';
import { answerQuery as answer, type BotContext } from './bot-context';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

export const isArrivedButton = (data: string | undefined) => data?.split(':')[0] === ARRIVED_PREFIX;

// «arrived:<booking>:yes» and «arrived:<booking>:no» under «Yetib keldingizmi?» (G46, docs/43):
// the question becomes the answer, without its buttons.
export async function onArrivedCallback(context: BotContext, query: BotCallback) {
  const [, bookingId, value] = (query.data ?? '').split(':');
  const token = botToken(context.env, 'passenger');
  if (!bookingId || (value !== 'yes' && value !== 'no') || !token || !query.message) return answer(query);
  // A person blocked on the road finishes the trip (docs/158 Ж): the answer counts, as in the app.
  const { env } = context;
  if ((await isBlocked(env, query.from.id)) && !(await ridingOf(env, query.from.id))) return answer(query);
  const yes = value === 'yes';
  if ((await answerArrived(context.env, query.from.id, bookingId, yes)) !== 'ok') return answer(query);
  await callTelegram(context.fetch, token, 'editMessageText', {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    text: t(yes ? 'bot.arrived.yes' : 'bot.arrived.onWay'),
    reply_markup: { inline_keyboard: [] },
  });
  return answer(query);
}
