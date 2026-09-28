import type { TeamRole } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { answerPerson, forwardToTeam, supportDeps } from '../modules/support';
import { teamMembers } from '../modules/team';
import { peopleOf } from '../modules/users';
import type { BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import type { BotMessage } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);
const TEAM_COMMAND = '/team';

// Support (docs/02): a person writes, every team member gets a copy. Owners can make the writer a moderator.
async function toSupport(context: BotContext, message: BotMessage) {
  const chatId = message.chat.id;
  if (!message.text) return sendMessage(chatId, t('bot.support.textOnly'));
  const personId = message.from?.id ?? chatId;
  const text = t('bot.support.incoming', {
    name: message.from?.first_name ?? '',
    id: String(personId),
    text: message.text,
  });
  const owners = new Set(
    (await teamMembers(context.env)).filter((member) => member.role === 'owner').map((member) => member.id),
  );
  const makeModerator = {
    inline_keyboard: [[{ text: t('bot.team.makeModerator'), callback_data: `team:add:${personId}` }]],
  };
  await forwardToTeam(supportDeps(context.env, context.fetch), chatId, text, (teamId) =>
    owners.has(teamId) ? makeModerator : undefined,
  );
  return sendMessage(chatId, t('bot.support.received'));
}

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
  if (role === null) return toSupport(context, message);
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
