import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetTones, startTone, unlockTones } from './call-tones';

afterEach(() => {
  forgetTones();
  vi.useRealTimers();
});

// An audio context that only counts the notes it was asked to play.
function fakeAudio(state = 'running') {
  const notes: number[] = [];
  const param = { value: 0, setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined };
  const audio = {
    state,
    currentTime: 0,
    destination: {},
    resume: vi.fn(async () => undefined),
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
  return { audio: audio as unknown as AudioContext, notes, resume: audio.resume };
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
    unlockTones(() => audio);
    expect(resume).toHaveBeenCalled();
    const stop = startTone('ring');
    expect(notes).toEqual([660, 880, 660, 880]);
    stop();
  });

  it('stays silent where the browser has no sound', () => {
    const stop = startTone('ring', () => null);
    expect(() => stop()).not.toThrow();
  });
});
