import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import {
  decideFaceOf,
  faceAtOf,
  faceCardText,
  faceDecisionLine,
  faceMenu,
  faceReasonMenu,
  parseFaceAction,
} from '../modules/users';
import { recordAction } from '../modules/journal';
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
    const markup = action.kind === 'menu' ? faceMenu(action) : faceReasonMenu(action);
    await edit('editMessageReplyMarkup', { reply_markup: markup });
    return answer(query);
  }
  // A card of an older photo: the person put a new one, its own card came after (owner, 17.10.2026).
  if (action.at !== null && action.at !== (await faceAtOf(context.env, action.userId))) {
    await edit('editMessageReplyMarkup', { reply_markup: { inline_keyboard: [] } });
    return answer(query, t('bot.face.changed'));
  }
  // The photo of the card is the one decided (G89 M8); the journal keeps it like a decision in the app (M14).
  const decision = action.at === null ? action.decision : { ...action.decision, at: action.at };
  const result = await decideFaceOf(context.env, query.from.id, action.userId, decision);
  if (result.ok) {
    const subject = result.user.publicId;
    const done = { memberId: query.from.id, kind: 'face' as const, subject, action: action.decision.action };
    await recordAction(context.env, { ...done, since: result.user.face?.at ?? null });
  }
  if (!result.ok) {
    await edit('editMessageReplyMarkup', { reply_markup: { inline_keyboard: [] } });
    return answer(query, t('bot.face.alreadyDecided'));
  }
  const line = faceDecisionLine(action.decision);
  const caption = `${faceCardText(result.user.firstName)}\n\n${line} (${query.from.first_name ?? query.from.id})`;
  await edit('editMessageCaption', { caption, reply_markup: { inline_keyboard: [] } });
  return answer(query, line);
}
