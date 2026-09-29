import { haptic } from '../telegram/feedback';

// The sounds of a call, like Telegram (docs/08): ringback for the caller, a ring for the callee.
// Made by the browser itself: no sound files, nothing to license.
type Tone = {
  readonly notes: readonly (readonly [hertz: number, seconds: number])[];
  readonly everyMs: number;
};

// The usual ringback of Uzbekistan and the CIS: 425 Hz, one second on, four seconds off.
const RINGBACK: Tone = { notes: [[425, 1]], everyMs: 5000 };
// A short rising ring, repeated every two seconds.
const RING: Tone = {
  notes: [
    [660, 0.2],
    [880, 0.2],
    [660, 0.2],
    [880, 0.2],
  ],
  everyMs: 2000,
};
const VOLUME = 0.15;
const FADE_SECONDS = 0.02;

export type ToneKind = 'ringback' | 'ring';
type Audio = Pick<
  AudioContext,
  'currentTime' | 'destination' | 'createOscillator' | 'createGain' | 'resume' | 'state'
>;

let shared: Audio | null = null;
// Tests start from a clean state.
export const forgetTones = () => void (shared = null);
// No sound where the browser has none (tests, old WebViews): the call works silently.
const browserAudio = (): Audio | null => (typeof AudioContext === 'undefined' ? null : new AudioContext());
const context = (make: () => Audio | null) => (shared ??= make());

// iPhone plays sound only after a tap: the tap on "Qoʻngʻiroq" or "Javob berish" opens it.
export function unlockTones(make: () => Audio | null = browserAudio): void {
  void context(make)?.resume();
}

function play(audio: Audio, tone: Tone): void {
  let at = audio.currentTime;
  for (const [hertz, seconds] of tone.notes) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = hertz;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(VOLUME, at + FADE_SECONDS);
    gain.gain.setValueAtTime(VOLUME, at + seconds - FADE_SECONDS);
    gain.gain.linearRampToValueAtTime(0, at + seconds);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + seconds);
    at += seconds;
  }
}

// Starts a tone at once and repeats it; the returned function stops it.
export function startTone(kind: ToneKind, make: () => Audio | null = browserAudio): () => void {
  const tone = kind === 'ringback' ? RINGBACK : RING;
  const audio = context(make);
  const once = () => {
    if (kind === 'ring') haptic.ring();
    if (!audio) return;
    if (audio.state === 'suspended') void audio.resume();
    play(audio, tone);
  };
  once();
  const timer = setInterval(once, tone.everyMs);
  return () => clearInterval(timer);
}
