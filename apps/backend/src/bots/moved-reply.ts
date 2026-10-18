import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { teamRole } from '../modules/team';
import { answerQuery, sendMessage, type BotContext } from './bot-context';
import type { BotRole } from './bot-roles';
import type { SUPPORT_BOT } from './support-bot';
import type { TelegramUpdate } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

// The internal environment is for the team only (owner, 17.10.2026, docs/179): anyone else who writes
// to one of its bots gets the way to the same bot of production; null: the bot answers as always.
export async function movedReply(bot: BotContext, role: BotRole | typeof SUPPORT_BOT, data: TelegramUpdate) {
  const goTo = bot.brand.teamOnly;
  const from = data.message?.from?.id ?? data.callback_query?.from.id;
  if (!goTo || role === 'admin' || from === undefined) return null;
  if ((await teamRole(bot.env, from)) !== null) return null;
  if (data.callback_query) return answerQuery(data.callback_query, t('bot.moved.text'));
  const button = { text: t('bot.moved.button'), url: `https://t.me/${goTo[role]}` };
  return data.message
    ? sendMessage(data.message.chat.id, t('bot.moved.text'), { inline_keyboard: [[button]] })
    : null;
}
