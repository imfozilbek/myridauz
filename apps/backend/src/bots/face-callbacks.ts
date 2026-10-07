import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import {
  decideFaceOf,
  faceCardText,
  faceDecisionLine,
  faceMenu,
  faceReasonMenu,
  parseFaceAction,
} from '../modules/users';
import { callTelegram } from '../shared/telegram/telegram-api';
import { answerQuery as answer, type BotContext } from './bot-context';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

// The buttons of the card of a new face photo (docs/120, G51): «Rasm mos», or «Mos emas» and a reason.
export async function onFaceButton(context: BotContext, query: BotCallback, token: string) {
  const action = parseFaceAction(query.data ?? '');
  if (!action || !query.message) return answer(query);
  const target = { chat_id: query.message.chat.id, message_id: query.message.message_id };
  const edit = (method: string, params: object) =>
    callTelegram(context.fetch, token, method, { ...target, ...params });
  if (action.kind !== 'decide') {
    const markup = action.kind === 'menu' ? faceMenu(action.userId) : faceReasonMenu(action.userId);
    await edit('editMessageReplyMarkup', { reply_markup: markup });
    return answer(query);
  }
  const result = await decideFaceOf(context.env, query.from.id, action.userId, action.decision);
  if (!result.ok) {
    await edit('editMessageReplyMarkup', { reply_markup: { inline_keyboard: [] } });
    return answer(query, t('bot.face.alreadyDecided'));
  }
  const line = faceDecisionLine(action.decision);
  const caption = `${faceCardText(result.user.firstName)}\n\n${line} (${query.from.first_name ?? query.from.id})`;
  await edit('editMessageCaption', { caption, reply_markup: { inline_keyboard: [] } });
  return answer(query, line);
}
