import type { Fetch } from '../../../shared/telegram/telegram-api';
import type { Realtime } from '../application/ports';

const BASE = 'https://rtc.live.cloudflare.com/v1';
// TURN credentials live one hour: long enough for a call, short if they leak.
const TURN_TTL_SECONDS = 3600;

type Options = {
  readonly appId: string;
  readonly appSecret: string;
  readonly turnKeyId: string;
  readonly turnKeyToken: string;
  readonly fetch: Fetch;
};
type Description = { readonly type: string; readonly sdp: string };
type TracksAnswer = {
  sessionDescription?: Description;
  requiresImmediateRenegotiation?: boolean;
  tracks?: { errorCode?: string }[];
};

export function realtimeApi({ appId, appSecret, turnKeyId, turnKeyToken, fetch }: Options): Realtime {
  // A new session takes no body at all: Realtime refuses even an empty object.
  async function call<T>(path: string, method: string, body: unknown, token = appSecret): Promise<T> {
    const authorization = `Bearer ${token}`;
    const init: RequestInit =
      body === undefined
        ? { method, headers: { authorization } }
        : {
            method,
            headers: { authorization, 'content-type': 'application/json' },
            body: JSON.stringify(body),
          };
    const response = await fetch(`${BASE}${path}`, init);
    if (!response.ok) throw new Error(`calls.realtime_${response.status}`);
    return (await response.json()) as T;
  }
  const session = (id: string) => `/apps/${appId}/sessions/${id}`;
  return {
    iceServers: () =>
      call(
        `/turn/keys/${turnKeyId}/credentials/generate-ice-servers`,
        'POST',
        { ttl: TURN_TTL_SECONDS },
        turnKeyToken,
      ),
    connect: async (offer, mid, trackName) => {
      const { sessionId } = await call<{ sessionId: string }>(
        `/apps/${appId}/sessions/new`,
        'POST',
        undefined,
      );
      const answer = await call<TracksAnswer>(`${session(sessionId)}/tracks/new`, 'POST', {
        sessionDescription: { type: 'offer', sdp: offer },
        tracks: [{ location: 'local', mid, trackName }],
      });
      return { sessionId, answer: answer.sessionDescription?.sdp ?? '' };
    },
    pull: async (sessionId, remote) => {
      const answer = await call<TracksAnswer>(`${session(sessionId)}/tracks/new`, 'POST', {
        tracks: [{ location: 'remote', sessionId: remote.sessionId, trackName: remote.trackName }],
      });
      // The other voice is not there yet (its side still connects): the Mini App tries again.
      if (answer.tracks?.some((track) => track.errorCode)) throw new Error('calls.track_not_ready');
      return answer.requiresImmediateRenegotiation ? (answer.sessionDescription?.sdp ?? null) : null;
    },
    renegotiate: async (sessionId, answer) =>
      void (await call(`${session(sessionId)}/renegotiate`, 'PUT', {
        sessionDescription: { type: 'answer', sdp: answer },
      })),
  };
}
