import { describe, expect, it, vi } from 'vitest';
import { FakePeer, fakeStream } from './fake-voice';
import { voiceLink, type VoiceApi } from './voice-link';

const api = (): VoiceApi => ({
  ice: async () => ({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] }),
  connect: vi.fn(async () => ({ sessionId: 's1', answer: 'sfu-answer' })),
  pull: vi.fn(async () => 'sfu-offer'),
  renegotiate: vi.fn(async () => undefined),
});
const events = () => ({ onPublished: vi.fn(), onConnected: vi.fn(), onFailed: vi.fn(), onRemote: vi.fn() });
const devices = (microphone = vi.fn(async () => fakeStream())) => ({
  peer: (config: RTCConfiguration) => new FakePeer(config) as unknown as RTCPeerConnection,
  microphone,
});

describe('voiceLink (docs/08)', () => {
  it('asks the microphone once, publishes the voice and pulls the other voice after publishing', async () => {
    const calls = api();
    const heard = events();
    const microphone = vi.fn(async () => fakeStream());
    const link = voiceLink(calls, heard, devices(microphone));
    await link.microphone();
    await link.pull({ sessionId: 's2', trackName: 'voice-b' });
    expect(calls.pull).not.toHaveBeenCalled();
    await link.start();
    await link.start();
    expect(microphone).toHaveBeenCalledTimes(1);
    expect(calls.connect).toHaveBeenCalledTimes(1);
    expect(heard.onPublished).toHaveBeenCalledWith({
      sessionId: 's1',
      trackName: expect.stringMatching(/^voice-/),
    });
    expect(calls.pull).toHaveBeenCalledWith('s1', { sessionId: 's2', trackName: 'voice-b' });
    expect(calls.renegotiate).toHaveBeenCalledWith('s1', 'local-answer');
    expect(FakePeer.last?.remote).toEqual(['sfu-answer', 'sfu-offer']);
    expect(FakePeer.last?.config.iceServers).toHaveLength(1);
  });

  it('starts the talk when the other voice arrives, tells a failure, and closes everything', async () => {
    const heard = events();
    const link = voiceLink(api(), heard, devices());
    await link.start();
    expect(heard.onConnected).not.toHaveBeenCalled();
    FakePeer.last?.hears();
    FakePeer.last?.becomes('failed');
    expect(heard.onConnected).toHaveBeenCalledTimes(1);
    expect(heard.onFailed).toHaveBeenCalledTimes(1);
    const peer = FakePeer.last;
    link.stop();
    expect(peer?.closed).toBe(true);
  });

  it('tries again while the other voice is not in Realtime yet', async () => {
    const calls = api();
    let tries = 0;
    calls.pull = vi.fn(async () => {
      tries += 1;
      if (tries < 3) throw new Error('calls.track_not_ready');
      return 'sfu-offer';
    });
    const link = voiceLink(calls, events(), devices(), 1);
    await link.start();
    await link.pull({ sessionId: 's2', trackName: 'voice-b' });
    expect(calls.pull).toHaveBeenCalledTimes(3);
    expect(calls.renegotiate).toHaveBeenCalledWith('s1', 'local-answer');
  });
});
