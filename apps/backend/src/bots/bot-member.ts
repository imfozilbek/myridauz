import type { Bindings } from '../env';
import { botBlockedBy } from '../modules/notifications';
import type { BotRole } from './bot-roles';
import { BLOCKED_STATUS, isStartCommand, type TelegramUpdate } from './telegram-update';

// The bot is quiet to a person who blocked it (G46, docs/191): Telegram says «kicked», and says
// it again when the person comes back; /start is a way back too.
export async function noteBotMember(env: Bindings, role: BotRole, update: TelegramUpdate): Promise<void> {
  const member = update.my_chat_member;
  if (member?.chat.type === 'private')
    return botBlockedBy(env, role, member.chat.id, member.new_chat_member.status === BLOCKED_STATUS);
  const message = update.message;
  if (message && isStartCommand(message.text)) await botBlockedBy(env, role, message.chat.id, false);
}
