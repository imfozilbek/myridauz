import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { supportDeps } from '../modules/support';
import { sendText } from '../shared/telegram/telegram-api';
import { answerQuery, type BotContext } from './bot-context';
import type { BotCallback } from './telegram-update';

const { t } = createI18n(DEFAULT_LOCALE);

// «Javob berish» under a copy (G31): the bot asks for the answer with a reply field already open.
// The question is linked to the same person, so the answer to it goes where a Reply to the copy goes.
export async function onReplyButton(context: BotContext, query: BotCallback) {
  const token = context.env.ADMIN_BOT_TOKEN;
  const copy = query.message;
  if (!token || !copy) return answerQuery(query);
  const deps = supportDeps(context.env, context.fetch);
  const writer = await deps.links.writer(copy.chat.id, copy.message_id);
  if (!writer) return answerQuery(query);
  const ask = { force_reply: true, input_field_placeholder: t('bot.support.reply') };
  const promptId = await sendText(context.fetch, token, copy.chat.id, t('bot.support.replyPrompt'), ask);
  if (promptId !== undefined) await deps.links.save(copy.chat.id, promptId, writer, deps.now());
  return answerQuery(query);
}
