import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { supportDeps, supportTalk } from '../modules/support';
import { sendText } from '../shared/telegram/telegram-api';
import { answerQuery, type BotContext } from './bot-context';
import { talkParts } from './support-talk';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);
// The buttons under a copy for the team (G31, G32).
export const REPLY_DATA = 'support:reply';
export const HISTORY_DATA = 'support:history';
const reply = { text: t('bot.support.reply'), callback_data: REPLY_DATA };
const history = { text: t('bot.support.history'), callback_data: HISTORY_DATA };
// «Tarix» only for a person who wrote before: the next team member learns the earlier questions.
export const copyButtons = (wroteBefore: boolean) => ({
  inline_keyboard: [wroteBefore ? [reply, history] : [reply]],
});

// The person of the copy under the pressed button, and what the admin bot needs to answer.
async function writerOfButton(context: BotContext, query: BotCallback) {
  const token = context.env.ADMIN_BOT_TOKEN;
  const copy = query.message;
  if (!token || !copy) return undefined;
  const deps = supportDeps(context.env, context.fetch);
  const writer = await deps.links.writer(copy.chat.id, copy.message_id);
  return writer && { token, chatId: copy.chat.id, writer, deps };
}

// «Javob berish» (G31): the bot asks for the answer with a reply field already open. The question is
// linked to the same person, so the answer to it goes where a Reply to the copy goes.
export async function onReplyButton(context: BotContext, query: BotCallback) {
  const found = await writerOfButton(context, query);
  if (!found) return answerQuery(query);
  const { token, chatId, writer, deps } = found;
  const ask = { force_reply: true, input_field_placeholder: t('bot.support.reply') };
  const promptId = await sendText(context.fetch, token, chatId, t('bot.support.replyPrompt'), ask);
  if (promptId !== undefined) await deps.links.save(chatId, promptId, writer, deps.now());
  return answerQuery(query);
}

// «Tarix» (G32): the whole support talk of the person, the team as «Operator N».
export async function onHistoryButton(context: BotContext, query: BotCallback) {
  const found = await writerOfButton(context, query);
  if (!found) return answerQuery(query);
  const { token, chatId, writer } = found;
  for (const part of talkParts(writer.chatId, await supportTalk(context.env, writer.chatId)))
    await sendText(context.fetch, token, chatId, part);
  return answerQuery(query);
}
