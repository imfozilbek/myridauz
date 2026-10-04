// The one sound output of the Mini App (docs/08, docs/115): call tones and the sounds of the brand
// play through it. iPhone opens it only after a tap; the first tap anywhere in the app does.
export type SoundAudio = Pick<
  AudioContext,
  | 'currentTime'
  | 'destination'
  | 'createOscillator'
  | 'createGain'
  | 'createBufferSource'
  | 'decodeAudioData'
  | 'resume'
  | 'state'
>;
export type MakeAudio = () => SoundAudio | null;

let shared: SoundAudio | null = null;
// No sound where the browser has none (tests, old WebViews): everything works silently.
const browserAudio: MakeAudio = () => (typeof AudioContext === 'undefined' ? null : new AudioContext());

export const sharedAudio = (make: MakeAudio = browserAudio) => (shared ??= make());
// Tests start from a clean state.
export const forgetAudio = () => void (shared = null);

export function unlockAudio(make: MakeAudio = browserAudio): void {
  void sharedAudio(make)?.resume();
}
