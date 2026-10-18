import type { ServerEvent } from '../modules/analytics';
import type { BotName } from '../shared/telegram/bot-config';
import { BLOCKED_STATUS, type BotCallback, type BotMember, type BotMessage } from './telegram-update';

// A command or a button of a bot as an analytics event (G12, docs/29): only ids, never the text.
const ID = /^[a-z][a-z0-9_]{0,31}$/;
const OTHER = 'other';
const idOf = (value: string) => (ID.test(value) ? value : OTHER);

type Update = {
  readonly message?: BotMessage | undefined;
  readonly callback_query?: BotCallback | undefined;
  readonly my_chat_member?: BotMember | undefined;
};

export function botEventOf(role: BotName, update: Update): ServerEvent | undefined {
  const member = update.my_chat_member;
  // Blocked or back again: only the bot and the change, never who (G87).
  if (member?.chat.type === 'private') {
    const code = member.new_chat_member.status === BLOCKED_STATUS ? 'blocked' : 'unblocked';
    return { name: 'bot_member', source: role, code };
  }
  const data = update.callback_query?.data;
  if (data !== undefined) return { name: 'bot_button', source: role, code: idOf(data.split(':')[0] ?? '') };
  const text = update.message?.text;
  if (!text?.startsWith('/')) return undefined;
  const command = text.slice(1).split(/[\s@]/)[0] ?? '';
  return { name: 'bot_command', source: role, code: idOf(command.toLowerCase()) };
}
