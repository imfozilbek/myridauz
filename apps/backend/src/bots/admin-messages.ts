import type { TeamRole } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { answerPerson, supportDeps } from '../modules/support';
import type { BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import { toSupportBot } from './support-bot';
import { onUserPicked, teamList } from './team-bot';
import type { BotMessage } from './telegram-update';
import { voiceOf } from './voice';

const { t } = createI18n(DEFAULT_LOCALE);
const TEAM_COMMAND = '/team';

export async function onAdminMessage(context: BotContext, message: BotMessage, role: TeamRole | null) {
  const chatId = message.chat.id;
  if (role === null) return toSupportBot(context.brand, chatId);
  if (message.users_shared) return onUserPicked(context, message);
  if (message.text === TEAM_COMMAND) {
    return role === 'owner' ? teamList(context, chatId) : sendMessage(chatId, t('bot.team.onlyOwner'));
  }
  if (!message.reply_to_message) return {};
  const voice = await voiceOf(context, 'admin', message);
  if (!message.text && !voice) return {};
  const brand = context.brand.name;
  const text = voice
    ? t('bot.support.voiceAnswer', { brand })
    : t('bot.support.answer', { brand, text: message.text ?? '' });
  const replied = message.reply_to_message.message_id;
  const sent = await answerPerson(supportDeps(context.env, context.fetch), chatId, replied, { text, voice });
  return sent ? sendMessage(chatId, t('bot.support.sent')) : {};
}
