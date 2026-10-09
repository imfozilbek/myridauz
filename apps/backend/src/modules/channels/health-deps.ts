import type { Bindings } from '../../env';
import { deadChannelPosts } from '../notifications';
import { channelArrivals } from '../users';
import type { HealthDeps } from './application/health';
import { allChannels } from './application/team';
import { createMemoryHealth, d1Health } from './infrastructure/d1-health';
import { memberCount } from './infrastructure/bot-admin';
import { teamDeps } from './team-deps';

const localHealth = createMemoryHealth();

// The health of the channels (G75): Telegram through the passenger bot, the lost posts from the
// notifications, the arrivals from the users.
export async function healthDeps(env: Bindings): Promise<HealthDeps> {
  const team = await teamDeps(env);
  return {
    channels: () => allChannels(team),
    store: env.DB ? d1Health(env.DB) : localHealth,
    count: memberCount((input, init) => fetch(input, init), env.PASSENGER_BOT_TOKEN),
    canPost: team.botIsAdmin,
    failed: (since) => deadChannelPosts(env, since),
    arrivals: (since) => channelArrivals(env, since),
    now: () => Date.now(),
  };
}
