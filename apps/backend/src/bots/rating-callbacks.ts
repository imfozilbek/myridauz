import { appHost } from '@platform/brands';
import { COMPLAIN_BELOW_STARS, STARS } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { COMPLAIN_PARAM, RATE_PREFIX, rateFromBot, REVIEW_PARAM } from '../modules/ratings';
import { isBlocked } from '../modules/users';
import { botToken } from '../shared/telegram/bot-config';
import { callTelegram } from '../shared/telegram/telegram-api';
import type { BotContext } from './bot-context';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

const answer = (query: BotCallback, text?: string) => ({
  method: 'answerCallbackQuery',
  callback_query_id: query.id,
  ...(text ? { text } : {}),
});

// "rate:<booking>:<stars>" under "Safar qanday oʻtdi?" (docs/24): the stars are saved, the message
// thanks and offers the review; 1 or 2 stars also offer a complaint (docs/17).
export async function onRatingCallback(
  context: BotContext,
  role: 'passenger' | 'driver',
  query: BotCallback,
) {
  const [prefix, bookingId, value] = (query.data ?? '').split(':');
  const stars = Number(value);
  const token = botToken(context.env, role);
  if (prefix !== RATE_PREFIX || !bookingId || !STARS.some((star) => star === stars) || !token)
    return answer(query);
  if (await isBlocked(context.env, query.from.id)) return answer(query);
  if ((await rateFromBot(context.env, query.from.id, bookingId, stars)) !== 'ok')
    return answer(query, t('bot.rating.late'));
  if (!query.message) return answer(query);
  const app = `https://${appHost(context.brand, role)}/`;
  const review = [{ text: t('bot.rating.review'), web_app: { url: `${app}?${REVIEW_PARAM}=${bookingId}` } }];
  const complain = [
    { text: t('bot.rating.complain'), web_app: { url: `${app}?${COMPLAIN_PARAM}=${bookingId}` } },
  ];
  await callTelegram(context.fetch, token, 'editMessageText', {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    text: t('bot.rating.thanks', { stars: String(stars) }),
    reply_markup: { inline_keyboard: stars < COMPLAIN_BELOW_STARS ? [review, complain] : [review] },
  });
  return answer(query);
}
