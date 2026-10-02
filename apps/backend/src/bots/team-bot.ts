import type { TeamRole } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { changeModerator, teamMembers } from '../modules/team';
import { peopleOf } from '../modules/users';
import { answerQuery as answer, type BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import type { BotCallback, BotMessage } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);
const ADD = 'add';

// The team list for an owner (docs/50): each moderator with «Olib tashlash», and how to add one.
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
  const text = [t('bot.team.title'), ...lines, '', t('bot.team.addHint')].join('\n');
  return sendMessage(chatId, text, { inline_keyboard: buttons });
}

// "/team" shows the team; "/team add <Telegram ID>" makes that person a moderator. Owner only.
export async function onTeamCommand(context: BotContext, message: BotMessage, role: TeamRole) {
  const chatId = message.chat.id;
  if (role !== 'owner') return sendMessage(chatId, t('bot.team.onlyOwner'));
  const [, action, id] = (message.text ?? '').trim().split(/\s+/u);
  if (action === undefined) return teamList(context, chatId);
  const userId = Number(id);
  if (action !== ADD || !Number.isSafeInteger(userId) || userId <= 0)
    return sendMessage(chatId, t('bot.team.addHint'));
  await changeModerator(context.env, chatId, userId, true);
  return sendMessage(chatId, t('bot.team.added'));
}

// "team:remove:<id>" under the team list: only an owner changes the team (docs/50).
export async function onTeamButton(context: BotContext, query: BotCallback, data: string) {
  const [, action, id] = data.split(':');
  const userId = Number(id);
  if (action !== 'remove' || !Number.isInteger(userId)) return answer(query);
  const result = await changeModerator(context.env, query.from.id, userId, false);
  return answer(query, t(result === 'ok' ? 'bot.team.removed' : 'bot.team.onlyOwner'));
}
