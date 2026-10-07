import type { Fetch } from '../../../shared/telegram/telegram-api';
import { telegramUrl } from '../../../shared/telegram/api-url';

type Member = {
  readonly result?: {
    readonly status?: string;
    readonly can_post_messages?: boolean;
    readonly is_member?: boolean;
  };
};

async function memberOf(fetch: Fetch, token: string, username: string, userId: number) {
  const response = await fetch(telegramUrl(token, 'getChatMember'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: `@${username}`, user_id: userId }),
  });
  return response.ok ? ((await response.json()) as Member).result : undefined;
}

// Whether the bot may post in a channel: an admin with the right to post (docs/63).
// The token never leaves this call; its first part is the bot id.
export const botIsAdmin = (fetch: Fetch, token: string | undefined) => async (username: string) => {
  if (!token) return false;
  const result = await memberOf(fetch, token, username, Number(token.split(':')[0]));
  return result?.status === 'administrator' && result.can_post_messages !== false;
};

const IN_CHANNEL = ['creator', 'administrator', 'member'];

// Whether a person is in a channel already (docs/119): one call, the bot is an admin there. An error
// or an unknown answer counts as not in: the invite goes.
export const inChannel =
  (fetch: Fetch, token: string | undefined) => async (username: string, userId: number) => {
    if (!token) return false;
    const result = await memberOf(fetch, token, username, userId).catch(() => undefined);
    return IN_CHANNEL.includes(result?.status ?? '') || result?.is_member === true;
  };
