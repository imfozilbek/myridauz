// A browser without real media in tests: a microphone that can be refused and a peer connection
// that only records what the call does (docs/08).
export class FakePeer {
  static last: FakePeer | null = null;
  ontrack: ((event: { streams: MediaStream[]; track: MediaStreamTrack }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState = 'new';
  readonly remote: string[] = [];
  closed = false;
  constructor(readonly config: RTCConfiguration) {
    FakePeer.last = this;
  }
  addTransceiver() {
    return { mid: '0' };
  }
  async createOffer() {
    return { type: 'offer', sdp: 'local-offer' };
  }
  async createAnswer() {
    return { type: 'answer', sdp: 'local-answer' };
  }
  async setLocalDescription() {}
  // Realtime answers the first offer, then the connection comes up.
  async setRemoteDescription(description: { sdp: string }) {
    this.remote.push(description.sdp);
    if (this.remote.length === 1) queueMicrotask(() => this.becomes('connected'));
  }
  // The other voice arrives.
  hears() {
    this.ontrack?.({ streams: [fakeStream()], track: fakeTrack() });
  }
  close() {
    this.closed = true;
  }
  becomes(state: string) {
    this.connectionState = state;
    this.onconnectionstatechange?.();
  }
}

const fakeTrack = () => ({ enabled: true, stop: () => undefined }) as unknown as MediaStreamTrack;
export const fakeStream = (track = fakeTrack()) =>
  ({ getAudioTracks: () => [track], getTracks: () => [track] }) as unknown as MediaStream;
