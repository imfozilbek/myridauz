import type { Bindings } from '../../env';
import { brandOf } from '../../shared/brand/brand-of';
import { callTelegram, type Fetch } from '../../shared/telegram/telegram-api';
import { teamRole } from '../team';
import type { ChannelChange } from './http/poster-routes';

// The channels of the internal environment are for the team only (owner, 17.10.2026, docs/179):
// anyone else who joins is taken out at once. Out and in again: Telegram lets them come back, and they
// are taken out again; the bot cannot write to a person who never started it.
async function keepTeamOnly(env: Bindings, change: ChannelChange, fetch: Fetch): Promise<void> {
  const token = env.POSTER_BOT_TOKEN;
  if (!token || !brandOf(env).teamOnly || !change.member) return;
  if ((await teamRole(env, change.userId)) !== null) return;
  const member = { chat_id: change.chat, user_id: change.userId };
  await callTelegram(fetch, token, 'banChatMember', member);
  await callTelegram(fetch, token, 'unbanChatMember', { ...member, only_if_banned: true });
}

type Heard = (env: Bindings, change: ChannelChange) => Promise<void>;
// The join is checked first, then the rest hears it: the ads of the waitlist (G83), set by the app.
export const teamOnlyFirst =
  (next: Heard): Heard =>
  async (env, change) => {
    await keepTeamOnly(env, change, (input, init) => fetch(input, init));
    await next(env, change);
  };
