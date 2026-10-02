import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { changeModerator, teamMembers } from '../modules/team';
import { peopleOf } from '../modules/users';
import { sendText } from '../shared/telegram/telegram-api';
import { answerQuery as answer, type BotContext } from './bot-context';
import { sendMessage } from './bot-context';
import type { BotCallback, BotMessage } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);
// The one person an owner picks from Telegram (KeyboardButtonRequestUsers).
const PICK_REQUEST = 1;

// The team list for an owner (docs/50): each moderator with «Olib tashlash», and «Moderator qoʻshish».
export async function teamList(context: BotContext, chatId: number) {
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
  const add = [{ text: t('bot.team.add'), callback_data: 'team:pick' }];
  return sendMessage(chatId, [t('bot.team.title'), ...lines].join('\n'), {
    inline_keyboard: [...buttons, add],
  });
}

// «Moderator qoʻshish»: Telegram opens the owner's chats, the owner picks one person, nothing is typed.
async function askToPick(context: BotContext, chatId: number) {
  const token = context.env.ADMIN_BOT_TOKEN;
  if (!token) return;
  const pick = { request_id: PICK_REQUEST, user_is_bot: false, max_quantity: 1 };
  await sendText(context.fetch, token, chatId, t('bot.team.pick'), {
    keyboard: [[{ text: t('bot.team.add'), request_users: pick }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  });
}

// "team:pick" and "team:remove:<id>": only an owner changes the team (docs/50).
export async function onTeamButton(context: BotContext, query: BotCallback, data: string) {
  const [, action, id] = data.split(':');
  if (action === 'pick') {
    const owner = (await teamMembers(context.env)).some((m) => m.id === query.from.id && m.role === 'owner');
    if (!owner) return answer(query, t('bot.team.onlyOwner'));
    if (query.message) await askToPick(context, query.message.chat.id);
    return answer(query);
  }
  const userId = Number(id);
  if (action !== 'remove' || !Number.isInteger(userId)) return answer(query);
  const result = await changeModerator(context.env, query.from.id, userId, false);
  return answer(query, t(result === 'ok' ? 'bot.team.removed' : 'bot.team.onlyOwner'));
}

// The person the owner picked becomes a moderator.
export async function onUserPicked(context: BotContext, message: BotMessage) {
  const chatId = message.chat.id;
  const userId = message.users_shared?.users[0]?.user_id;
  if (userId === undefined) return {};
  const result = await changeModerator(context.env, message.from?.id ?? chatId, userId, true);
  const text = t(result === 'ok' ? 'bot.team.added' : 'bot.team.onlyOwner');
  return sendMessage(chatId, text, { remove_keyboard: true });
}
