import type { NotificationJob } from './job';
import { bodyOf, methodOf } from './telegram-body';
import { telegramUrl } from '../../../shared/telegram/api-url';

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;
export type Tokens = Readonly<Record<NotificationJob['bot'], string | undefined>>;

// sent: done; retry: Telegram asks to wait (429) or failed for a moment; drop: it will never work
// (the person blocked the bot or never opened it), the rest of Rida goes on (docs/07); gone: the
// message to edit was deleted or is too old, a live card is sent anew (G68).
export type Delivery =
  | { readonly outcome: 'sent'; readonly messageId: number | null }
  | { readonly outcome: 'retry'; readonly afterSeconds: number }
  | { readonly outcome: 'drop' }
  | { readonly outcome: 'gone' };

const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;
const DEFAULT_RETRY_SECONDS = 5;
const BAD_REQUEST = 400;
const NOT_MODIFIED = 'message is not modified';
const GONE = ['message to edit not found', "message can't be edited"];

// An edit Telegram refused: the same text is done already, a deleted or old message is gone.
function refusedEdit(job: NotificationJob, description: string): Delivery | null {
  if (job.edit === undefined) return null;
  if (description.includes(NOT_MODIFIED)) return { outcome: 'sent', messageId: job.edit };
  return GONE.some((reason) => description.includes(reason)) ? { outcome: 'gone' } : null;
}

export async function deliver(fetch: Fetch, tokens: Tokens, job: NotificationJob): Promise<Delivery> {
  const token = tokens[job.bot];
  if (!token) return { outcome: 'drop' };
  let response: Response;
  try {
    response = await fetch(telegramUrl(token, methodOf(job)), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(bodyOf(job)),
    });
  } catch {
    return { outcome: 'retry', afterSeconds: DEFAULT_RETRY_SECONDS };
  }
  const body = (await response.json().catch(() => ({}))) as {
    result?: { message_id?: number };
    parameters?: { retry_after?: number };
    description?: string;
  };
  if (response.ok) return { outcome: 'sent', messageId: body.result?.message_id ?? null };
  const refused = response.status === BAD_REQUEST ? refusedEdit(job, body.description ?? '') : null;
  if (refused) return refused;
  if (response.status === TOO_MANY_REQUESTS)
    return { outcome: 'retry', afterSeconds: body.parameters?.retry_after ?? DEFAULT_RETRY_SECONDS };
  if (response.status >= SERVER_ERROR) return { outcome: 'retry', afterSeconds: DEFAULT_RETRY_SECONDS };
  console.warn(JSON.stringify({ event: 'notification_dropped', bot: job.bot, status: response.status }));
  return { outcome: 'drop' };
}
