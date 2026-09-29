import type { CallTrack, IceServers } from '@platform/contracts';

// Cloudflare Realtime (docs/08): the SFU carries the voice, TURN helps through closed networks.
// Only audio; Realtime keeps nothing, and neither does Rida.
export type Realtime = {
  iceServers(): Promise<IceServers>;
  // A new session that publishes the local voice: the answer to the Mini App's offer.
  connect(offer: string, mid: string, trackName: string): Promise<{ sessionId: string; answer: string }>;
  // Pull the other side's voice into this session: sometimes Realtime sends a new offer at once.
  pull(sessionId: string, remote: CallTrack): Promise<string | null>;
  renegotiate(sessionId: string, answer: string): Promise<void>;
};
