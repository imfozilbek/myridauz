import type { BrandConfig } from '@platform/brands';
import {
  helpAudienceOf,
  helpQuestionOf,
  helpTopicOf,
  type HelpAudience,
  type HelpTopic,
} from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { recordServerEvent } from '../modules/analytics';
import { approvedCar } from '../modules/drivers';
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

// «/yordam» (G97, docs/226): the topics of the person in a message of their own. The bots of a
// passenger and of a driver show the topics of their role (docs/231).
export const helpReply = (brand: BrandConfig, bot: HelpBot, chatId: number, audience: HelpAudience) => {
  const view = topicsView(brand, bot, audience);
  return { ...sendMessage(chatId, view.text, markup(view)), parse_mode: 'HTML' };
};

// A button of an older message has no audience: the role of its bot, or someone with no role yet.
const audienceOf = (bot: HelpBot, value: string): HelpAudience =>
  helpAudienceOf(value) ?? (bot === 'passenger' || bot === 'driver' ? bot : 'guest');

// An approved driver has no questions of the application left but the change of the car, as in the
// Mini App (docs/231): the bot asks only when that topic opens.
const isApproved = async (context: BotContext, topic: HelpTopic, chatId: number | undefined) =>
  topic === 'application' && chatId !== undefined && (await approvedCar(context.env, chatId)) !== null;

// The view a button asks for, and what the analytics hear of it (docs/29).
async function viewOf(context: BotContext, bot: HelpBot, data: readonly string[], chatId?: number) {
  const brand = context.brand;
  const [kind = '', value = '', whose = ''] = data;
  if (kind === 'topics') return { view: topicsView(brand, bot, audienceOf(bot, value)), code: 'topics' };
  const audience = audienceOf(bot, whose);
  const topic = kind === 't' ? helpTopicOf(value) : null;
  if (topic) {
    const approved = await isApproved(context, topic, chatId);
    return { view: questionsView(brand, bot, topic, audience, approved), code: topic };
  }
  const question = kind === 'q' ? helpQuestionOf(value) : null;
  return question ? { view: answerView(brand, bot, question, audience), code: question } : null;
}

// A button of the help: the same message changes in place. The topics of the support bot stand
// under its welcome picture, so there the caption changes; elsewhere the text.
export async function onHelpCallback(context: BotContext, bot: HelpBot, query: BotCallback) {
  const [, ...data] = (query.data ?? '').split(':');
  const chatId = query.message?.chat.id;
  if (data[0] === 'more' && bot === 'support' && chatId !== undefined) {
    recordServerEvent(context.env, { name: 'help_more', source: bot });
    const token = botToken(context.env, bot);
    if (token)
      await callTelegram(context.fetch, token, 'answerCallbackQuery', { callback_query_id: query.id });
    return sendMessage(chatId, t('bot.support.ask'));
  }
  const found = await viewOf(context, bot, data, chatId);
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
