import { z } from 'zod';
import { locationIdSchema } from './locations';

// Channels of the team (docs/63): a channel covers a list of places, a region or districts.
// A trip goes to every channel whose list has the place it leaves or the place it goes to.
export const ADMIN_CHANNELS_PATH = '/admin/channels';
export const adminChannelPath = (username: string) => `${ADMIN_CHANNELS_PATH}/${username}`;

// A public Telegram username: letters, digits and "_", 5 to 32 signs.
export const CHANNEL_USERNAME = /^[A-Za-z][A-Za-z0-9_]{4,31}$/u;
export const CHANNEL_TITLE_MAX = 64;
export const CHANNEL_PLACES_MAX = 40;

export const channelInputSchema = z.object({
  title: z.string().trim().min(1).max(CHANNEL_TITLE_MAX),
  places: z.array(locationIdSchema).min(1).max(CHANNEL_PLACES_MAX),
});
export type ChannelInput = z.input<typeof channelInputSchema>;

export const channelSchema = channelInputSchema.extend({
  username: z.string().regex(CHANNEL_USERNAME),
  // The channels of the brand config (13 regions) cannot be edited in the admin, only in the code.
  fixed: z.boolean(),
});
export type Channel = z.infer<typeof channelSchema>;

export const channelsResponseSchema = z.object({ channels: z.array(channelSchema) });
