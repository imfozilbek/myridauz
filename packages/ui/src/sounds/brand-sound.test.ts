import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetAudio, unlockAudio, type SoundAudio } from './audio';
import { forgetSounds, loadSounds, playNotify, playRing, previewSound } from './brand-sound';

afterEach(() => {
  forgetAudio();
  forgetSounds();
  vi.unstubAllGlobals();
});

// An audio output that only lists what it played: the size of each file and whether it loops.
function fakeAudio() {
  const played: { size: number; loop: boolean }[] = [];
  const audio = {
    state: 'running',
    resume: async () => undefined,
    decodeAudioData: async (data: ArrayBuffer) => ({ size: data.byteLength }),
    createBufferSource: () => {
      const source = {
        buffer: { size: 0 },
        loop: false,
        connect: () => undefined,
        start: () => played.push({ size: source.buffer.size, loop: source.loop }),
        stop: () => undefined,
      };
      return source;
    },
  };
  unlockAudio(() => audio as unknown as SoundAudio);
  return played;
}

// The ring file is 4 bytes, the notification 2: enough to tell them apart.
const files = (ok = true) =>
  vi.stubGlobal('fetch', async (url: string) =>
    ok
      ? new Response(new ArrayBuffer(url.endsWith('ring.wav') ? 4 : 2))
      : new Response(null, { status: 404 }),
  );

describe('the sounds of the brand (G54, docs/115)', () => {
  it('plays a notification once in a burst and never over a ring', async () => {
    const played = fakeAudio();
    files();
    await loadSounds('1', '/');
    playNotify(10_000);
    playNotify(11_000);
    expect(played).toEqual([{ size: 2, loop: false }]);
    const stop = playRing();
    playNotify(20_000);
    expect(played).toEqual([
      { size: 2, loop: false },
      { size: 4, loop: true },
    ]);
    stop?.();
    playNotify(30_000);
    expect(played).toHaveLength(3);
  });

  it('stays silent and gives no ring when the files did not load', async () => {
    const played = fakeAudio();
    files(false);
    await loadSounds('1', '/');
    playNotify(10_000);
    expect(playRing()).toBeNull();
    expect(await previewSound('2', 'ring', '/')).toBe(false);
    expect(played).toEqual([]);
  });

  it('lets the team listen to any set once', async () => {
    const played = fakeAudio();
    files();
    expect(await previewSound('2', 'ring', '/')).toBe(true);
    expect(played).toEqual([{ size: 4, loop: false }]);
  });
});
