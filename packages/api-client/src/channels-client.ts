import {
  ADMIN_CHANNELS_PATH,
  adminChannelPath,
  channelSchema,
  channelsResponseSchema,
  driverTripPublicityPath,
  MY_CHANNELS_PATH,
  myChannelsSchema,
  tripPublicitySchema,
  tripViewPath,
  type Channel,
  type ChannelInput,
  type MyChannel,
  type TripPublicity,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The team's channels in the admin Mini App (docs/63), the channels of a driver's trip, and
// «Kanallar» of a person (G65).
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
    // After the publishing (G63, docs/119): «Safaringiz kanalda chiqdi», «N koʻrdi», the link.
    tripPublicity: async (tripId: string): Promise<TripPublicity> =>
      tripPublicitySchema.parse(await (await request(driverTripPublicityPath(tripId))).json()),
    // A person opened the trip page: «N koʻrdi» counts each person once, never the driver.
    tripViewed: async (tripId: string): Promise<void> => {
      await request(tripViewPath(tripId), { method: 'POST' });
    },
    mine: async (): Promise<MyChannel[]> =>
      myChannelsSchema.parse(await (await request(MY_CHANNELS_PATH)).json()).channels,
  };
}

export type ChannelsClient = ReturnType<typeof createChannelsClient>;
