import { z } from 'zod';
import { locationIdSchema } from './locations';
import { DRIVER_TRIPS_PATH, TRIPS_PATH } from './trips';

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

// What the driver sees right after the publishing (G63, docs/119): the channels of the trip and
// whether its post is there, how many different people opened it in the app, and the link to send.
export const driverTripPublicityPath = (tripId: string) => `${DRIVER_TRIPS_PATH}/${tripId}/publicity`;
export const tripPublicitySchema = z.object({
  channels: z.array(
    z.object({ username: z.string().regex(CHANNEL_USERNAME), title: z.string(), posted: z.boolean() }),
  ),
  views: z.number().int().min(0),
  link: z.string().startsWith('https://t.me/'),
});
export type TripPublicity = z.infer<typeof tripPublicitySchema>;
// The trip page of the passenger app says it was opened: from the search, a post button or a link.
export const tripViewPath = (tripId: string) => `${TRIPS_PATH}/${tripId}/view`;

// «Kanallar» of a person (G65, docs/119): the channels of the zones that are there, and «✓ Aʼzosiz».
export const MY_CHANNELS_PATH = '/me/channels';
export const myChannelSchema = z.object({
  username: z.string().regex(CHANNEL_USERNAME),
  member: z.boolean(),
});
export type MyChannel = z.infer<typeof myChannelSchema>;
export const myChannelsSchema = z.object({ channels: z.array(myChannelSchema) });
export type MyChannels = z.infer<typeof myChannelsSchema>;
