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
import { teamRole } from '../modules/team';
import { peopleOf } from '../modules/users';
import { callTelegram } from '../shared/telegram/telegram-api';
import { answerQuery as answer, type BotContext } from './bot-context';
import { HISTORY_DATA, onHistoryButton, onReplyButton, REPLY_DATA } from './support-reply';
import { onTeamButton } from './team-bot';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

// The buttons of the moderation card (docs/04): approve, reject or ask for changes with ticked reasons.
export async function onAdminCallback(context: BotContext, query: BotCallback) {
  const token = context.env.ADMIN_BOT_TOKEN;
  const data = query.data ?? '';
  if (!token || (await teamRole(context.env, query.from.id)) === null) return answer(query);
  if (data.startsWith('team:')) return onTeamButton(context, query, data);
  if (data === REPLY_DATA) return onReplyButton(context, query);
  if (data === HISTORY_DATA) return onHistoryButton(context, query);
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
