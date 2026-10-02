import type { TeamRole } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { answerPerson, supportDeps } from '../modules/support';
import { teamMembers } from '../modules/team';
import { peopleOf } from '../modules/users';
import type { BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import { toSupportBot } from './support-bot';
import type { BotMessage } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);
const TEAM_COMMAND = '/team';

// The team list for an owner, each moderator with a button to remove them (docs/02, question 36).
async function teamList(context: BotContext, chatId: number) {
  const people = peopleOf(context.env);
  const members = await teamMembers(context.env);
  const named = await Promise.all(
    members.map(async (member) => ({
      ...member,
      name: (await people.find(member.id))?.firstName ?? String(member.id),
    })),
  );
  const lines = named.map((member) => `${t(`bot.team.${member.role}`)}: ${member.name} (ID ${member.id})`);
  const buttons = named
    .filter((member) => member.role === 'moderator')
    .map((member) => [
      { text: `${t('bot.team.remove')}: ${member.name}`, callback_data: `team:remove:${member.id}` },
    ]);
  return sendMessage(chatId, [t('bot.team.title'), ...lines].join('\n'), { inline_keyboard: buttons });
}

export async function onAdminMessage(context: BotContext, message: BotMessage, role: TeamRole | null) {
  const chatId = message.chat.id;
  if (role === null) return toSupportBot(context.brand, chatId);
  if (message.text === TEAM_COMMAND) {
    return role === 'owner' ? teamList(context, chatId) : sendMessage(chatId, t('bot.team.onlyOwner'));
  }
  if (!message.reply_to_message || !message.text) return {};
  const answer = t('bot.support.answer', { brand: context.brand.name, text: message.text });
  const sent = await answerPerson(
    supportDeps(context.env, context.fetch),
    chatId,
    message.reply_to_message.message_id,
    answer,
  );
  return sent ? sendMessage(chatId, t('bot.support.sent')) : {};
}
