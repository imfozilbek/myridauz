import { z } from 'zod';

// Voice calls inside the chat of a booking (docs/08, G13): signaling on the chat socket,
// the voice through Cloudflare Realtime. Nothing is recorded or stored.
export const CALL_STATUSES = ['ringing', 'connecting', 'active'] as const;
export const CALL_ACTIONS = ['ring', 'accept', 'decline', 'end', 'connected', 'failed'] as const;
export type CallAction = (typeof CALL_ACTIONS)[number];
// Why a call is over: declined, not answered in time, no connection in time or broken, hung up.
export const CALL_ENDINGS = ['declined', 'missed', 'failed', 'ended'] as const;
export type CallEnding = (typeof CALL_ENDINGS)[number];

export const callViewSchema = z.object({
  status: z.enum(CALL_STATUSES),
  caller: z.enum(['me', 'other']),
});
export type CallView = z.infer<typeof callViewSchema>;

// A published voice track of one side: the other side pulls it from Realtime.
const id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/u);
export const callTrackSchema = z.object({ sessionId: id, trackName: id });
export type CallTrack = z.infer<typeof callTrackSchema>;

export const callServerEvents = [
  z.object({ type: z.literal('call'), call: callViewSchema.nullable() }),
  z.object({ type: z.literal('callEnded'), reason: z.enum(CALL_ENDINGS) }),
  z.object({ type: z.literal('callTrack'), track: callTrackSchema }),
] as const;

export const callClientEvents = [
  z.object({ type: z.literal('call'), action: z.enum(CALL_ACTIONS) }),
  z.object({ type: z.literal('callTrack'), track: callTrackSchema }),
] as const;

// The API that talks to Realtime for the Mini App: the app secret never leaves the backend.
export const callIcePath = (key: string) => `/calls/${key}/ice`;
export const callConnectPath = (key: string) => `/calls/${key}/connect`;
export const callPullPath = (key: string) => `/calls/${key}/pull`;
export const callRenegotiatePath = (key: string) => `/calls/${key}/renegotiate`;

const sdp = z.string().min(1).max(20_000);
export const iceServersSchema = z.object({
  iceServers: z.array(
    z.object({
      urls: z.union([z.string(), z.array(z.string())]),
      username: z.string().optional(),
      credential: z.string().optional(),
    }),
  ),
});
export type IceServers = z.infer<typeof iceServersSchema>;
export const callConnectInputSchema = z.object({ offer: sdp, mid: z.string().max(16), trackName: id });
export const callConnectSchema = z.object({ sessionId: id, answer: sdp });
export const callPullInputSchema = z.object({ sessionId: id, remote: callTrackSchema });
// Realtime may ask the Mini App to answer a new offer at once.
export const callPullSchema = z.object({ offer: sdp.nullable() });
export const callRenegotiateInputSchema = z.object({ sessionId: id, answer: sdp });
