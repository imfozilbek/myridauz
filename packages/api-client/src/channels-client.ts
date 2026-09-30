import {
  ADMIN_CHANNELS_PATH,
  adminChannelPath,
  channelSchema,
  channelsResponseSchema,
  type Channel,
  type ChannelInput,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The team's channels in the admin Mini App (docs/63).
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
  };
}

export type ChannelsClient = ReturnType<typeof createChannelsClient>;
