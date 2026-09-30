import { appHost } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import {
  cardMenu,
  cardText,
  decideApplication,
  decisionLine,
  driversDeps,
  parseCardAction,
  plateCheckMenu,
  reasonMenu,
} from '../modules/drivers';
import { changeModerator, teamRole } from '../modules/team';
import { peopleOf } from '../modules/users';
import { callTelegram } from '../shared/telegram/telegram-api';
import type { BotContext } from './bot-context';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

const answer = (query: BotCallback, text?: string) => ({
  method: 'answerCallbackQuery',
  callback_query_id: query.id,
  ...(text ? { text } : {}),
});

// "team:add:<id>" and "team:remove:<id>": only an owner changes the team (docs/02).
async function onTeamButton(context: BotContext, query: BotCallback, data: string) {
  const [, action, id] = data.split(':');
  const userId = Number(id);
  if ((action !== 'add' && action !== 'remove') || !Number.isInteger(userId)) return answer(query);
  const result = await changeModerator(context.env, query.from.id, userId, action === 'add');
  if (result !== 'ok') return answer(query, t('bot.team.onlyOwner'));
  return answer(query, t(action === 'add' ? 'bot.team.added' : 'bot.team.removed'));
}

// The buttons of the moderation card (docs/04): approve, reject or ask for changes with ticked reasons.
export async function onAdminCallback(context: BotContext, query: BotCallback) {
  const token = context.env.ADMIN_BOT_TOKEN;
  const data = query.data ?? '';
  if (!token || (await teamRole(context.env, query.from.id)) === null) return answer(query);
  if (data.startsWith('team:')) return onTeamButton(context, query, data);
  const action = parseCardAction(data);
  if (!action || !query.message) return answer(query);
  const target = { chat_id: query.message.chat.id, message_id: query.message.message_id };
  const edit = (method: string, params: object) =>
    callTelegram(context.fetch, token, method, { ...target, ...params });
  if (action.kind === 'none_picked') return answer(query, t('bot.moderation.pickReason'));
  if (action.kind === 'check_plate') {
    const adminUrl = `https://${appHost(context.brand, 'admin')}/`;
    const publicId = (await peopleOf(context.env).find(action.userId))?.publicId ?? '';
    const menu = plateCheckMenu(action.userId, publicId, adminUrl);
    await edit('editMessageReplyMarkup', { reply_markup: menu });
    return answer(query, t('bot.moderation.checkPlate'));
  }
  if (action.kind !== 'decide') {
    const markup =
      action.kind === 'menu'
        ? cardMenu(action.userId)
        : reasonMenu(action.userId, action.action, action.picked);
    await edit('editMessageReplyMarkup', { reply_markup: markup });
    return answer(query);
  }
  const result = await decideApplication(
    driversDeps(context.env),
    query.from.id,
    action.userId,
    action.decision,
  );
  if (!result.ok) {
    await edit('editMessageReplyMarkup', { reply_markup: { inline_keyboard: [] } });
    return answer(query, t('bot.moderation.alreadyDecided'));
  }
  const line = decisionLine(result.value);
  const text = `${cardText(result.value, result.value.firstName)}\n\n${line} (${query.from.first_name ?? query.from.id})`;
  await edit('editMessageText', { text, reply_markup: { inline_keyboard: [] } });
  return answer(query, line);
}
