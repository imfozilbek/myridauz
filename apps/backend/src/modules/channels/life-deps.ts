import type { Bindings } from '../../env';
import { createMemoryChannelLife, d1ChannelLife } from './infrastructure/channel-life';

// The joins, leaves and reactions of the channels by day (G87, docs/191): the bot of the posts writes
// them, the hourly check adds the people of a day, «Kanallar» of the owner reads them.
const localLife = createMemoryChannelLife();
export const channelLifeOf = (env: Bindings) => (env.DB ? d1ChannelLife(env.DB) : localLife);
