import type { Fetch } from '../../../shared/telegram/telegram-api';

type Member = { readonly result?: { readonly status?: string; readonly can_post_messages?: boolean } };

// Whether the bot may post in a channel: an admin with the right to post (docs/63).
// The token never leaves this call; its first part is the bot id.
export const botIsAdmin = (fetch: Fetch, token: string | undefined) => async (username: string) => {
  if (!token) return false;
  const response = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: `@${username}`, user_id: Number(token.split(':')[0]) }),
  });
  if (!response.ok) return false;
  const { result } = (await response.json()) as Member;
  return result?.status === 'administrator' && result.can_post_messages !== false;
};
