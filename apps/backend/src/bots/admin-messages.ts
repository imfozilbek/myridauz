import type { TeamRole } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { markAnswered } from '../modules/assignments';
import { answerPerson, supportDeps } from '../modules/support';
import type { BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import { toSupportBot } from './support-bot';
import { onTeamCommand } from './team-bot';
import type { BotMessage } from './telegram-update';
import { voiceOf } from './voice';

const { t } = createI18n(DEFAULT_LOCALE);
const TEAM_COMMAND = '/team';

export async function onAdminMessage(context: BotContext, message: BotMessage, role: TeamRole | null) {
  const chatId = message.chat.id;
  if (role === null) return toSupportBot(context.brand, chatId);
  if (message.text?.split(' ')[0] === TEAM_COMMAND) return onTeamCommand(context, message, role);
  if (!message.reply_to_message) return {};
  const voice = await voiceOf(context, 'admin', message);
  if (!message.text && !voice) return {};
  const brand = context.brand.name;
  const text = voice
    ? t('bot.support.voiceAnswer', { brand })
    : t('bot.support.answer', { brand, text: message.text ?? '' });
  const replied = message.reply_to_message.message_id;
  const writer = await answerPerson(supportDeps(context.env, context.fetch), chatId, replied, {
    text,
    voice,
  });
  if (!writer) return {};
  // The question is answered: it counts in the digest of the team (docs/92).
  await markAnswered(context.env, writer.chatId);
  return sendMessage(chatId, t('bot.support.sent'));
}
