import type { BrandConfig } from '@platform/brands';
import { helpQuestionOf, helpTopicOf } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { recordServerEvent } from '../modules/analytics';
import { botToken } from '../shared/telegram/bot-config';
import { callTelegram } from '../shared/telegram/telegram-api';
import { answerQuery as answer, sendMessage, type BotContext } from './bot-context';
import {
  answerView,
  HELP_PREFIX,
  questionsView,
  topicsView,
  type HelpBot,
  type HelpView,
} from './help-markup';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

export const isHelpButton = (data: string | undefined) => data?.split(':')[0] === HELP_PREFIX;

const markup = (view: HelpView) => ({ inline_keyboard: view.rows });

// «/yordam» (G97, docs/226): the topics in a message of their own.
export const helpReply = (brand: BrandConfig, bot: HelpBot, chatId: number) => {
  const view = topicsView(brand, bot);
  return { ...sendMessage(chatId, view.text, markup(view)), parse_mode: 'HTML' };
};

// The view a button asks for, and what the analytics hear of it (docs/29).
function viewOf(brand: BrandConfig, bot: HelpBot, kind: string, value: string) {
  if (kind === 'topics') return { view: topicsView(brand, bot), code: 'topics' };
  const topic = kind === 't' ? helpTopicOf(value) : null;
  if (topic) return { view: questionsView(brand, bot, topic), code: topic };
  const question = kind === 'q' ? helpQuestionOf(value) : null;
  return question ? { view: answerView(brand, bot, question), code: question } : null;
}

// A button of the help: the same message changes in place. The topics of the support bot stand
// under its welcome picture, so there the caption changes; elsewhere the text.
export async function onHelpCallback(context: BotContext, bot: HelpBot, query: BotCallback) {
  const [, kind = '', value = ''] = (query.data ?? '').split(':');
  const chatId = query.message?.chat.id;
  if (kind === 'more' && bot === 'support' && chatId !== undefined) {
    recordServerEvent(context.env, { name: 'help_more', source: bot });
    const token = botToken(context.env, bot);
    if (token)
      await callTelegram(context.fetch, token, 'answerCallbackQuery', { callback_query_id: query.id });
    return sendMessage(chatId, t('bot.support.ask'));
  }
  const found = viewOf(context.brand, bot, kind, value);
  const token = botToken(context.env, bot);
  if (!found || !query.message || !token) return answer(query);
  recordServerEvent(context.env, { name: 'help_open', source: bot, code: found.code });
  const where = { chat_id: query.message.chat.id, message_id: query.message.message_id };
  const shown = { parse_mode: 'HTML', reply_markup: markup(found.view) };
  await (bot === 'support'
    ? callTelegram(context.fetch, token, 'editMessageCaption', {
        ...where,
        ...shown,
        caption: found.view.text,
      })
    : callTelegram(context.fetch, token, 'editMessageText', { ...where, ...shown, text: found.view.text }));
  return answer(query);
}
