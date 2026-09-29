import type { CallTrack, IceServers } from '@platform/contracts';

// The voice of a call through Cloudflare Realtime (docs/08): one peer connection publishes this
// side's microphone and pulls the other side's voice. Only audio, nothing is recorded.
export type VoiceApi = {
  ice(): Promise<IceServers>;
  connect(offer: string, mid: string, trackName: string): Promise<{ sessionId: string; answer: string }>;
  pull(sessionId: string, remote: CallTrack): Promise<string | null>;
  renegotiate(sessionId: string, answer: string): Promise<void>;
};
export type VoiceEvents = {
  onPublished(track: CallTrack): void;
  onConnected(): void;
  onFailed(): void;
  onRemote(stream: MediaStream): void;
};
export type VoiceDevices = {
  readonly peer: (config: RTCConfiguration) => RTCPeerConnection;
  readonly microphone: () => Promise<MediaStream>;
};

const browserDevices: VoiceDevices = {
  peer: (config) => new RTCPeerConnection(config),
  microphone: () => navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
};

export function voiceLink(api: VoiceApi, events: VoiceEvents, devices: VoiceDevices = browserDevices) {
  let mic: MediaStream | null = null;
  let pc: RTCPeerConnection | null = null;
  let sessionId: string | null = null;
  let waiting: CallTrack | null = null;
  let started = false;

  // Android Telegram asks again on every request: the microphone is asked once per call (docs/08).
  async function microphone(): Promise<MediaStream> {
    mic ??= await devices.microphone();
    return mic;
  }

  async function pull(remote: CallTrack): Promise<void> {
    if (!pc || !sessionId) return void (waiting = remote);
    waiting = null;
    const offer = await api.pull(sessionId, remote);
    if (!offer) return;
    await pc.setRemoteDescription({ type: 'offer', sdp: offer });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await api.renegotiate(sessionId, answer.sdp ?? '');
  }

  async function start(): Promise<void> {
    if (started) return;
    started = true;
    const [track] = (await microphone()).getAudioTracks();
    if (!track) throw new Error('call.no_microphone');
    const { iceServers } = await api.ice();
    const servers = iceServers.map(({ urls, username, credential }) => ({
      urls,
      ...(username === undefined ? {} : { username }),
      ...(credential === undefined ? {} : { credential }),
    }));
    const peer = devices.peer({ iceServers: servers, bundlePolicy: 'max-bundle' });
    pc = peer;
    peer.ontrack = (event) => events.onRemote(event.streams[0] ?? new MediaStream([event.track]));
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') events.onConnected();
      if (peer.connectionState === 'failed') events.onFailed();
    };
    const transceiver = peer.addTransceiver(track, { direction: 'sendonly' });
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const trackName = `voice-${crypto.randomUUID()}`;
    const published = await api.connect(offer.sdp ?? '', transceiver.mid ?? '0', trackName);
    sessionId = published.sessionId;
    await peer.setRemoteDescription({ type: 'answer', sdp: published.answer });
    events.onPublished({ sessionId, trackName });
    if (waiting) await pull(waiting);
  }

  return {
    microphone,
    start,
    pull,
    mute: (muted: boolean) => mic?.getAudioTracks().forEach((track) => (track.enabled = !muted)),
    stop: () => {
      mic?.getTracks().forEach((track) => track.stop());
      pc?.close();
      [mic, pc, sessionId, waiting, started] = [null, null, null, null, false];
    },
  };
}

export type VoiceLink = ReturnType<typeof voiceLink>;
