import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import type { Bindings } from '../../env';
import { deadChannelPosts } from '../notifications';
import { channelArrivals } from '../users';
import type { HealthDeps } from './application/health';
import { allChannels } from './application/team';
import { createMemoryChannelDays, d1ChannelDays } from './infrastructure/d1-channel-days';
import { createMemoryHealth, d1Health } from './infrastructure/d1-health';
import { createAppLink, memberCount } from './infrastructure/bot-admin';
import { teamDeps } from './team-deps';
import { brandOf } from '../../shared/brand/brand-of';

const { t } = createI18n(DEFAULT_LOCALE);
const localHealth = createMemoryHealth();
// What the hourly check last read of each channel (G75).
export const healthStoreOf = (env: Bindings) => (env.DB ? d1Health(env.DB) : localHealth);
const localDays = createMemoryChannelDays();
// The joins, leaves and people of each channel by day (G87 V5).
export const channelDaysOf = (env: Bindings) => (env.DB ? d1ChannelDays(env.DB) : localDays);

// The health of the channels (G75): Telegram through the bot of the channels, the lost posts from the
// notifications, the arrivals from the users.
export async function healthDeps(env: Bindings): Promise<HealthDeps> {
  const team = await teamDeps(env);
  const call = (input: string, init?: RequestInit) => fetch(input, init);
  const name = t('bot.zone.appLink', { brand: brandOf(env).name });
  return {
    channels: () => allChannels(team),
    store: healthStoreOf(env),
    days: channelDaysOf(env),
    count: memberCount(call, env.POSTER_BOT_TOKEN),
    canPost: team.botIsAdmin,
    appLink: createAppLink(call, env.POSTER_BOT_TOKEN, name),
    failed: (since) => deadChannelPosts(env, since),
    arrivals: (since) => channelArrivals(env, since),
    now: () => Date.now(),
  };
}
