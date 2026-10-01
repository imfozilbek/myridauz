import { execFileSync } from 'node:child_process';
import { loadBrand } from '../../brands/index';
import { STAND_API_PORT, STAND_STATE, STAND_TELEGRAM_PORT } from '../../scripts/stand/paths.ts';
import { botOfToken } from './stand-kit';

// The tools of the scenarios beyond a phone (docs/75): what the bots sent, the Cron at once, and
// the clock moved by moving the times of the records in the database of the stand.
const TELEGRAM = `http://localhost:${STAND_TELEGRAM_PORT}/__sent`;
const CRON = '*/15 * * * *';

type Button = { readonly text: string; readonly url: string | null };
export type BotMessage = {
  readonly bot: string;
  readonly method: string;
  readonly chatId: number | null;
  // The chat as Telegram got it: a person's id or a channel's @username.
  readonly chat: string;
  readonly text: string;
  readonly buttons: readonly Button[];
};
type Call = { readonly token: string; readonly method: string; readonly body: Record<string, unknown> };
type Markup = { inline_keyboard?: { text: string; url?: string; web_app?: { url: string } }[][] };

const messageOf = ({ token, method, body }: Call): BotMessage => {
  const markup = (body['reply_markup'] ?? {}) as Markup;
  const buttons = (markup.inline_keyboard ?? []).flat().map((button) => ({
    text: button.text,
    url: button.web_app?.url ?? button.url ?? null,
  }));
  const chat = body['chat_id'];
  return {
    bot: botOfToken(token),
    method,
    chatId: typeof chat === 'number' ? chat : null,
    chat: String(chat ?? ''),
    text: String(body['text'] ?? ''),
    buttons,
  };
};

// Every message the bots sent since the last clear, oldest first.
export async function botMessages(): Promise<BotMessage[]> {
  const calls = (await (await fetch(TELEGRAM)).json()) as Call[];
  return calls.map(messageOf);
}
export const clearBotMessages = async () => void (await fetch(TELEGRAM, { method: 'DELETE' }));

// The Cron of the Worker at once, as Cloudflare runs it every 15 minutes.
export async function runCron(): Promise<void> {
  const url = `http://localhost:${STAND_API_PORT}/__scheduled?cron=${encodeURIComponent(CRON)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`stand: the Cron answered ${response.status}`);
}

// One SQL statement on the database of the stand: a scenario moves a time into the past.
const d1 = (sql: string, json: boolean): string => {
  const config = `brands/${loadBrand().id}/wrangler.toml`;
  const args = ['exec', 'wrangler', 'd1', 'execute', 'DB', '--local', '--persist-to', STAND_STATE];
  const output = json ? ['--json'] : [];
  return execFileSync('pnpm', [...args, ...output, '--config', config, '--command', sql], {
    stdio: 'pipe',
    encoding: 'utf8',
  });
};
export const standSql = (sql: string): void => void d1(sql, false);
// The rows of one query on the database of the stand.
export function standRows(sql: string): Record<string, unknown>[] {
  const [result] = JSON.parse(d1(sql, true)) as { results: Record<string, unknown>[] }[];
  return result?.results ?? [];
}
