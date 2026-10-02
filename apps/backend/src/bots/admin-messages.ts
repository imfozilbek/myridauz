import type { TeamRole } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { markAnswered, operatorOf } from '../modules/assignments';
import { answerPerson, recordSupport, supportDeps } from '../modules/support';
import type { BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import { toSupportBot } from './support-bot';
import { onTeamCommand } from './team-bot';
import type { BotMessage } from './telegram-update';
import { mediaOf } from './media';

const { t } = createI18n(DEFAULT_LOCALE);
const TEAM_COMMAND = '/team';
const MEDIA_ANSWER = { voice: 'bot.support.voiceAnswer', photo: 'bot.support.photoAnswer' } as const;

export async function onAdminMessage(context: BotContext, message: BotMessage, role: TeamRole | null) {
  const chatId = message.chat.id;
  if (role === null) return toSupportBot(context.brand, chatId);
  if (message.text?.split(' ')[0] === TEAM_COMMAND) return onTeamCommand(context, message, role);
  if (!message.reply_to_message) return {};
  const media = await mediaOf(context, 'admin', message);
  const said = message.text ?? message.caption;
  if (said === undefined && !media) return {};
  let operator = '';
  const contentFor = async (to: { readonly chatId: number }) => {
    operator = String(await operatorOf(context.env, to.chatId));
    const text = media
      ? [t(MEDIA_ANSWER[media.kind], { operator }), said].filter(Boolean).join('\n\n')
      : t('bot.support.answer', { operator, text: said ?? '' });
    return { text, media };
  };
  const replied = message.reply_to_message.message_id;
  const writer = await answerPerson(supportDeps(context.env, context.fetch), chatId, replied, contentFor);
  if (!writer) return {};
  // The talk keeps the answer as «Operator N», never the name of the team member (G32).
  const name = t('bot.support.operator', { operator });
  const entry = { personId: writer.chatId, at: Date.now(), author: 'team' as const, name };
  await recordSupport(context.env, { ...entry, kind: media?.kind ?? 'text', text: said ?? '' });
  // The question is answered: it counts in the digest of the team (docs/92).
  await markAnswered(context.env, writer.chatId);
  return sendMessage(chatId, t('bot.support.sent'));
}
