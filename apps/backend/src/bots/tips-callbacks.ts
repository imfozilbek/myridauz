import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { TIPS_OFF, tipsOff } from '../modules/tips';
import { botToken } from '../shared/telegram/bot-config';
import { callTelegram } from '../shared/telegram/telegram-api';
import { answerQuery as answer, type BotContext } from './bot-context';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

export const isTipsOffButton = (data: string | undefined) => data === TIPS_OFF;

// «Kerak emas» under a tip of a step (G70a, docs/232): no more tips for the person, the other
// messages of the bots stay; the buttons leave the tip.
export async function onTipsOffCallback(
  context: BotContext,
  role: 'passenger' | 'driver',
  query: BotCallback,
) {
  await tipsOff(context.env, query.from.id);
  const token = botToken(context.env, role);
  if (query.message && token)
    await callTelegram(context.fetch, token, 'editMessageReplyMarkup', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      reply_markup: { inline_keyboard: [] },
    });
  return answer(query, t('bot.tip.offDone'));
}
