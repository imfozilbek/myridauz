import type { NotificationJob } from './job';

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;
export type Tokens = Readonly<Record<NotificationJob['bot'], string | undefined>>;

// sent: done; retry: Telegram asks to wait (429) or failed for a moment; drop: it will never work
// (the person blocked the bot or never opened it), the rest of Rida goes on (docs/07).
export type Delivery =
  | { readonly outcome: 'sent'; readonly messageId: number | null }
  | { readonly outcome: 'retry'; readonly afterSeconds: number }
  | { readonly outcome: 'drop' };

const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;
const DEFAULT_RETRY_SECONDS = 5;

export async function deliver(fetch: Fetch, tokens: Tokens, job: NotificationJob): Promise<Delivery> {
  const token = tokens[job.bot];
  if (!token) return { outcome: 'drop' };
  let response: Response;
  try {
    const method = job.edit === undefined ? 'sendMessage' : 'editMessageText';
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: job.chatId,
        text: job.text,
        ...(job.html ? { parse_mode: 'HTML' } : {}),
        ...(job.edit === undefined ? {} : { message_id: job.edit }),
        ...(job.markup ? { reply_markup: job.markup } : {}),
      }),
    });
  } catch {
    return { outcome: 'retry', afterSeconds: DEFAULT_RETRY_SECONDS };
  }
  const body = (await response.json().catch(() => ({}))) as {
    result?: { message_id?: number };
    parameters?: { retry_after?: number };
  };
  if (response.ok) return { outcome: 'sent', messageId: body.result?.message_id ?? null };
  if (response.status === TOO_MANY_REQUESTS)
    return { outcome: 'retry', afterSeconds: body.parameters?.retry_after ?? DEFAULT_RETRY_SECONDS };
  if (response.status >= SERVER_ERROR) return { outcome: 'retry', afterSeconds: DEFAULT_RETRY_SECONDS };
  console.warn(`notifications.dropped_${response.status}`);
  return { outcome: 'drop' };
}
