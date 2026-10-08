import {
  ADMIN_CHANNELS_PATH,
  adminChannelPath,
  channelSchema,
  channelsResponseSchema,
  driverTripPublicityPath,
  tripPublicitySchema,
  tripViewPath,
  type Channel,
  type ChannelInput,
  type TripPublicity,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The team's channels in the admin Mini App (docs/63), and the channels of a driver's trip.
export function createChannelsClient(options: SignedOptions) {
  const { request, putJson } = signedRequest(options);
  return {
    list: async (): Promise<Channel[]> =>
      channelsResponseSchema.parse(await (await request(ADMIN_CHANNELS_PATH)).json()).channels,
    save: async (username: string, input: ChannelInput): Promise<Channel> =>
      channelSchema.parse(await (await putJson(adminChannelPath(username), input)).json()),
    remove: async (username: string): Promise<void> => {
      await request(adminChannelPath(username), { method: 'DELETE' });
    },
    // After the publishing (G63, docs/119): «Safaringiz kanalda chiqdi», «N kishi koʻrdi», the link.
    tripPublicity: async (tripId: string): Promise<TripPublicity> =>
      tripPublicitySchema.parse(await (await request(driverTripPublicityPath(tripId))).json()),
    // A person opened the trip page: «N kishi koʻrdi» counts each person once, never the driver.
    tripViewed: async (tripId: string): Promise<void> => {
      await request(tripViewPath(tripId), { method: 'POST' });
    },
  };
}

export type ChannelsClient = ReturnType<typeof createChannelsClient>;
