import type { ServerEvent } from '../modules/analytics';
import type { BotRole } from './bot-roles';
import type { BotCallback, BotMessage } from './telegram-update';

// A command or a button of a bot as an analytics event (G12, docs/29): only ids, never the text.
const ID = /^[a-z][a-z0-9_]{0,31}$/;
const OTHER = 'other';
const idOf = (value: string) => (ID.test(value) ? value : OTHER);

export function botEventOf(
  role: BotRole,
  update: { readonly message?: BotMessage | undefined; readonly callback_query?: BotCallback | undefined },
): ServerEvent | undefined {
  const data = update.callback_query?.data;
  if (data !== undefined) return { name: 'bot_button', source: role, code: idOf(data.split(':')[0] ?? '') };
  const text = update.message?.text;
  if (!text?.startsWith('/')) return undefined;
  const command = text.slice(1).split(/[\s@]/)[0] ?? '';
  return { name: 'bot_command', source: role, code: idOf(command.toLowerCase()) };
}
