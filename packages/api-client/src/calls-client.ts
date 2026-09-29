import {
  callConnectPath,
  callConnectSchema,
  callIcePath,
  callPullPath,
  callPullSchema,
  callRenegotiatePath,
  iceServersSchema,
  type CallTrack,
  type IceServers,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// A voice call through Cloudflare Realtime, via the backend (docs/08, G13).
export function createCallsClient(options: SignedOptions) {
  const { post } = signedRequest(options);
  return {
    ice: async (key: string): Promise<IceServers> =>
      iceServersSchema.parse(await (await post(callIcePath(key), {})).json()),
    connect: async (key: string, offer: string, mid: string, trackName: string) =>
      callConnectSchema.parse(await (await post(callConnectPath(key), { offer, mid, trackName })).json()),
    pull: async (key: string, sessionId: string, remote: CallTrack): Promise<string | null> =>
      callPullSchema.parse(await (await post(callPullPath(key), { sessionId, remote })).json()).offer,
    renegotiate: async (key: string, sessionId: string, answer: string): Promise<void> =>
      void (await post(callRenegotiatePath(key), { sessionId, answer })),
  };
}

export type CallsClient = ReturnType<typeof createCallsClient>;
