import { z } from 'zod';
import { CHANNEL_CHAT } from './channels';

// The health of the channels in «Kanallar» of «Boshqaruv» (G75, docs/120, docs/119): how many people
// are in each, whether the bot may still post there, the posts Telegram never took this week and the
// people who came to Rida by its posts this month. The owner only.
export const ADMIN_CHANNEL_HEALTH_PATH = '/admin/channel-health';
export const FAILED_POSTS_DAYS = 7;
export const CHANNEL_ARRIVALS_DAYS = 30;
// G87 (docs/191): who joined and left, and the reactions of the posts, in the last week.
export const CHANNEL_LIFE_DAYS = 7;
const count = z.number().int().min(0);

export const channelHealthSchema = z.object({
  channels: z.array(
    z.object({
      chat: z.string().regex(CHANNEL_CHAT),
      title: z.string(),
      // The last check by the Cron; null before the first one or when Telegram did not answer.
      subscribers: z.number().int().min(0).nullable(),
      canPost: z.boolean().nullable(),
      checkedAt: z.number().int().nullable(),
      failed: count,
      arrivals: count,
      // G87 (docs/191). A Worker rolled back to before G87 answers without them: 0 then.
      joined: count.default(0),
      gone: count.default(0),
      reactions: count.default(0),
      topReactions: count.default(0),
    }),
  ),
});
export type ChannelHealth = z.infer<typeof channelHealthSchema>;
