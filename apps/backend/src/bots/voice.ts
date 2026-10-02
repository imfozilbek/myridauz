import { botToken, type BotName } from '../shared/telegram/bot-config';
import { downloadFile } from '../shared/telegram/telegram-files';
import type { BotContext } from './bot-context';
import type { BotMessage } from './telegram-update';

// The bytes of a voice message, taken by the bot that got it (docs/50).
export async function voiceOf(context: BotContext, bot: BotName, message: BotMessage) {
  const token = botToken(context.env, bot);
  if (!message.voice || !token) return undefined;
  return downloadFile(context.fetch, token, message.voice.file_id);
}
