import { readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
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
  // The texts of the buttons row by row, as Telegram puts them under the message.
  readonly rows: readonly (readonly string[])[];
  // The id of a sent message; the message an edit, a pin or a delete is about; the card a ring
  // answers (G68, docs/122).
  readonly messageId: number | null;
  readonly target: number | null;
  readonly replyTo: number | null;
};
type Call = {
  readonly token: string;
  readonly method: string;
  readonly body: Record<string, unknown>;
  readonly id?: number;
};
const idOf = (value: unknown) => (typeof value === 'number' ? value : null);
type Markup = { inline_keyboard?: { text: string; url?: string; web_app?: { url: string } }[][] };

const messageOf = ({ token, method, body, id }: Call): BotMessage => {
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
    // A voice or an album carries its line as a caption.
    text: String(body['text'] ?? body['caption'] ?? ''),
    buttons,
    rows: (markup.inline_keyboard ?? []).map((row) => row.map((button) => button.text)),
    messageId: id ?? null,
    target: idOf(body['message_id']),
    replyTo: idOf((body['reply_parameters'] as { message_id?: unknown } | undefined)?.message_id),
  };
};

// Every message the bots sent since the last clear, oldest first.
export async function botMessages(): Promise<BotMessage[]> {
  const calls = (await (await fetch(TELEGRAM)).json()) as Call[];
  return calls.map(messageOf);
}
export const clearBotMessages = async () => void (await fetch(TELEGRAM, { method: 'DELETE' }));

// The local Worker reloads now and then after a write to its database from outside: then a scenario
// waits for the Worker and asks once more.
const API = `http://localhost:${STAND_API_PORT}`;
const RELOAD_WAIT_MS = 30_000;
export async function workerBack(): Promise<void> {
  const until = Date.now() + RELOAD_WAIT_MS;
  while (Date.now() < until) {
    if (
      await fetch(`${API}/health`).then(
        (r) => r.ok,
        () => false,
      )
    )
      return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
// A reload can close the answer even after the health check passed (lesson 91): every request of
// a scenario to the Worker goes through here and tries a few times.
const RELOAD_TRIES = 3;
export async function despiteReload(send: () => Promise<Response>): Promise<Response> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await send();
    } catch (error) {
      if (attempt === RELOAD_TRIES) throw error;
      await workerBack();
    }
  }
}
// The Cron of the Worker at once, as Cloudflare runs it every 15 minutes.
export async function runCron(): Promise<void> {
  const url = `${API}/__scheduled?cron=${encodeURIComponent(CRON)}`;
  const response = await despiteReload(() => fetch(url));
  if (!response.ok) throw new Error(`stand: the Cron answered ${response.status}`);
}

// The database of the stand is opened directly, as the Worker opens it: a query takes milliseconds,
// not the two seconds of a wrangler process (G71). One connection stays open for the whole run and
// never checkpoints: closing or checkpointing locks the file for a moment, and the Worker, which does
// not wait for a busy file, would fail its own write. A busy file on our side waits (lesson 78).
const BUSY_TIMEOUT_MS = 5_000;
const D1_DIR = `${STAND_STATE}/v3/d1/miniflare-D1DatabaseObject`;
let opened: DatabaseSync | undefined;
function database(): DatabaseSync {
  if (opened) return opened;
  const file = readdirSync(D1_DIR).find((name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite');
  if (!file) throw new Error(`stand: no database in ${D1_DIR}`);
  opened = new DatabaseSync(`${D1_DIR}/${file}`);
  opened.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}; PRAGMA wal_autocheckpoint = 0;`);
  return opened;
}
export const standSql = (sql: string): void => database().exec(sql);
// The rows of one query on the database of the stand.
export const standRows = (sql: string): Record<string, unknown>[] =>
  database().prepare(sql).all() as Record<string, unknown>[];
