import type { ServerEvent } from '../modules/analytics';
import type { BotName } from '../shared/telegram/bot-config';
import type { BotCallback, BotMember, BotMessage } from './telegram-update';

// A command or a button of a bot as an analytics event (G12, docs/29): only ids, never the text.
const ID = /^[a-z][a-z0-9_]{0,31}$/;
const OTHER = 'other';
const idOf = (value: string) => (ID.test(value) ? value : OTHER);

// A person blocked the bot or came back after a block (G87 V1): counted by the bot, never who.
const BLOCKED = 'kicked';
function memberEventOf(role: BotName, member: BotMember): ServerEvent | undefined {
  const { old_chat_member: before, new_chat_member: now } = member;
  if (now.status === BLOCKED) return { name: 'bot_member', source: role, code: 'blocked' };
  return before.status === BLOCKED ? { name: 'bot_member', source: role, code: 'returned' } : undefined;
}

export function botEventOf(
  role: BotName,
  update: {
    readonly message?: BotMessage | undefined;
    readonly callback_query?: BotCallback | undefined;
    readonly my_chat_member?: BotMember | undefined;
  },
): ServerEvent | undefined {
  if (update.my_chat_member) return memberEventOf(role, update.my_chat_member);
  const data = update.callback_query?.data;
  if (data !== undefined) return { name: 'bot_button', source: role, code: idOf(data.split(':')[0] ?? '') };
  const text = update.message?.text;
  if (!text?.startsWith('/')) return undefined;
  const command = text.slice(1).split(/[\s@]/)[0] ?? '';
  return { name: 'bot_command', source: role, code: idOf(command.toLowerCase()) };
}
