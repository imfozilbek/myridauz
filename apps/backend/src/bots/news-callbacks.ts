import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { NEWS_OFF_PREFIX, stopFromBot } from '../modules/route-subscriptions';
import { botToken } from '../shared/telegram/bot-config';
import { callTelegram } from '../shared/telegram/telegram-api';
import { answerQuery as answer, type BotContext } from './bot-context';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

export const isNewsOffButton = (data: string | undefined) => data?.split(':')[0] === NEWS_OFF_PREFIX;

// «news_off:<subscription>» under a news card (docs/122 rule 4): the subscription of the person
// ends and the buttons leave the card. A passenger follows trips, a driver requests; only the
// owner of the subscription can end it.
export async function onNewsOffCallback(
  context: BotContext,
  role: 'passenger' | 'driver',
  query: BotCallback,
) {
  const [, id] = (query.data ?? '').split(':');
  const kind = role === 'passenger' ? 'trips' : 'requests';
  if (!id || !(await stopFromBot(context.env, query.from.id, kind, id))) return answer(query);
  const token = botToken(context.env, role);
  if (query.message && token)
    await callTelegram(context.fetch, token, 'editMessageReplyMarkup', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      reply_markup: { inline_keyboard: [] },
    });
  return answer(query, t('bot.news.offDone'));
}
