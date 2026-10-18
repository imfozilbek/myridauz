import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../env';
import { deadChannelPosts } from '../notifications';
import { channelArrivals } from '../users';
import type { HealthDeps } from './application/health';
import { allChannels } from './application/team';
import { createMemoryHealth, d1Health } from './infrastructure/d1-health';
import { createAppLink, memberCount } from './infrastructure/bot-admin';
import { channelLifeOf } from './life-deps';
import { teamDeps } from './team-deps';
import { brandOf } from '../../shared/brand/brand-of';

const { t } = createI18n(DEFAULT_LOCALE);
const localHealth = createMemoryHealth();
// What the hourly check last read of each channel (G75).
export const healthStoreOf = (env: Bindings) => (env.DB ? d1Health(env.DB) : localHealth);

// The health of the channels (G75): Telegram through the bot of the channels, the lost posts from the
// notifications, the arrivals from the users.
export async function healthDeps(env: Bindings): Promise<HealthDeps> {
  const team = await teamDeps(env);
  const call = (input: string, init?: RequestInit) => fetch(input, init);
  const name = t('bot.zone.appLink', { brand: brandOf(env).name });
  return {
    channels: () => allChannels(team),
    store: healthStoreOf(env),
    count: memberCount(call, env.POSTER_BOT_TOKEN),
    canPost: team.botIsAdmin,
    appLink: createAppLink(call, env.POSTER_BOT_TOKEN, name),
    failed: (since) => deadChannelPosts(env, since),
    arrivals: (since) => channelArrivals(env, since),
    life: channelLifeOf(env),
    now: () => Date.now(),
  };
}
