import type { Fetch } from '../../../shared/telegram/telegram-api';
import { telegramUrl } from '../../../shared/telegram/api-url';

type Member = {
  readonly result?: {
    readonly status?: string;
    readonly can_post_messages?: boolean;
    readonly is_member?: boolean;
  };
};

async function memberOf(fetch: Fetch, token: string, chat: string, userId: number) {
  const response = await fetch(telegramUrl(token, 'getChatMember'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, user_id: userId }),
  });
  return response.ok ? ((await response.json()) as Member).result : undefined;
}

// Whether the bot may post in a channel: an admin with the right to post (docs/63).
// The token never leaves this call; its first part is the bot id.
export const botIsAdmin = (fetch: Fetch, token: string | undefined) => async (chat: string) => {
  if (!token) return false;
  const result = await memberOf(fetch, token, chat, Number(token.split(':')[0]));
  return result?.status === 'administrator' && result.can_post_messages !== false;
};

const IN_CHANNEL = ['creator', 'administrator', 'member'];

// Whether a person is in a channel (docs/119): one call, the bot is an admin there. An error or an
// unknown answer counts as not in: the invite goes.
export const inChannel =
  (fetch: Fetch, token: string | undefined) => async (chat: string, userId: number) => {
    if (!token) return false;
    const result = await memberOf(fetch, token, chat, userId).catch(() => undefined);
    return IN_CHANNEL.includes(result?.status ?? '') || result?.is_member === true;
  };

// How many people are in a channel (G75): one call; null when Telegram does not answer.
export const memberCount = (fetch: Fetch, token: string | undefined) => async (chat: string) => {
  if (!token) return null;
  const response = await fetch(telegramUrl(token, 'getChatMemberCount'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat }),
  }).catch(() => undefined);
  if (!response?.ok) return null;
  const { result } = (await response.json()) as { readonly result?: number };
  return typeof result === 'number' ? result : null;
};
