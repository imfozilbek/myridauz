import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetAudio, unlockAudio } from '../sounds/audio';
import { forgetSounds, loadSounds } from '../sounds/brand-sound';
import { startTone } from './call-tones';

afterEach(() => {
  forgetAudio();
  forgetSounds();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// An audio context that only counts the notes it was asked to play.
function fakeAudio(state = 'running') {
  const notes: number[] = [];
  const sources: { buffer: unknown; loop: boolean }[] = [];
  const param = { value: 0, setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined };
  const audio = {
    state,
    currentTime: 0,
    destination: {},
    resume: vi.fn(async () => undefined),
    decodeAudioData: async (data: ArrayBuffer) => ({ length: data.byteLength }),
    createBufferSource: () => {
      const source = {
        buffer: null as unknown,
        loop: false,
        connect: () => undefined,
        start: () => sources.push(source),
        stop: () => void (source.loop = false),
      };
      return source;
    },
    createGain: () => ({ gain: param, connect: (next: unknown) => next }),
    createOscillator: () => {
      const oscillator = {
        frequency: { value: 0 },
        connect: (next: unknown) => next,
        start: () => notes.push(oscillator.frequency.value),
        stop: () => undefined,
      };
      return oscillator;
    },
  };
  return { audio: audio as unknown as AudioContext, notes, sources, resume: audio.resume };
}

describe('call tones (docs/08)', () => {
  it('plays the 425 Hz ringback every five seconds until stopped', () => {
    vi.useFakeTimers();
    const { audio, notes } = fakeAudio();
    const stop = startTone('ringback', () => audio);
    expect(notes).toEqual([425]);
    vi.advanceTimersByTime(5000);
    expect(notes).toEqual([425, 425]);
    stop();
    vi.advanceTimersByTime(20_000);
    expect(notes).toHaveLength(2);
  });

  it('rings the callee with a short melody and opens the sound after a tap', () => {
    const { audio, notes, resume } = fakeAudio('suspended');
    unlockAudio(() => audio);
    expect(resume).toHaveBeenCalled();
    const stop = startTone('ring');
    expect(notes).toEqual([660, 880, 660, 880]);
    stop();
  });

  it('rings with the loop of the brand set once it loaded, and stops it (docs/115)', async () => {
    const { audio, notes, sources } = fakeAudio();
    unlockAudio(() => audio);
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      urls.push(url);
      return new Response(new ArrayBuffer(8));
    });
    await loadSounds('3', '/');
    expect(urls.sort()).toEqual(['/sounds/3-notify.wav', '/sounds/3-ring.wav']);
    const stop = startTone('ring');
    expect(notes).toEqual([]);
    expect(sources).toEqual([expect.objectContaining({ loop: true })]);
    stop();
    expect(sources[0]?.loop).toBe(false);
  });

  it('stays silent where the browser has no sound', () => {
    const stop = startTone('ring', () => null);
    expect(() => stop()).not.toThrow();
  });
});
