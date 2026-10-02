import { botToken, type BotName } from '../shared/telegram/bot-config';
import { downloadFile, type Media } from '../shared/telegram/telegram-files';
import type { BotContext } from './bot-context';
import type { BotMessage } from './telegram-update';

// The voice message or the largest photo of a message, taken by the bot that got it (docs/50, G32).
export async function mediaOf(
  context: BotContext,
  bot: BotName,
  message: BotMessage,
): Promise<Media | undefined> {
  const token = botToken(context.env, bot);
  const photo = message.photo?.at(-1);
  if (!token) return undefined;
  if (message.voice)
    return { kind: 'voice', data: await downloadFile(context.fetch, token, message.voice.file_id) };
  if (photo) return { kind: 'photo', data: await downloadFile(context.fetch, token, photo.file_id) };
  return undefined;
}
