import { playRing } from '../sounds/brand-sound';
import { sharedAudio, type MakeAudio, type SoundAudio } from '../sounds/audio';
import { haptic } from '../telegram/feedback';

// The sounds of a call, like Telegram (docs/08): ringback for the caller, a ring for the callee.
// Made by the browser itself; the ring of the brand set replaces the melody once it loaded (docs/115).
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

function play(audio: SoundAudio, tone: Tone): void {
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

// Starts a tone at once and repeats it; the returned function stops it. The callee hears the ring of
// the brand set when it loaded, the melody above when it did not; the phone shakes with each ring.
export function startTone(kind: ToneKind, make?: MakeAudio): () => void {
  const tone = kind === 'ringback' ? RINGBACK : RING;
  const audio = sharedAudio(make);
  const brand = kind === 'ring' ? playRing() : null;
  const once = () => {
    if (kind === 'ring') haptic.ring();
    if (!audio || brand) return;
    if (audio.state === 'suspended') void audio.resume();
    play(audio, tone);
  };
  once();
  const timer = setInterval(once, tone.everyMs);
  return () => {
    clearInterval(timer);
    brand?.();
  };
}
