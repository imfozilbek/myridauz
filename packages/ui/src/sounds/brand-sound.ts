import { soundFile } from '@platform/contracts';
import { sharedAudio } from './audio';

// The sounds of the brand set in use (docs/115): downloaded once per session, then the ring of an
// incoming call and the notification of a bot message play at once.
type Kind = 'ring' | 'notify';
const KINDS: readonly Kind[] = ['ring', 'notify'];
// A burst of messages is one sound.
const NOTIFY_GAP_MS = 3000;

const loaded = new Map<Kind, AudioBuffer>();
let ringing = 0;
let lastNotify = -Infinity;

async function decode(url: string): Promise<AudioBuffer | null> {
  const audio = sharedAudio();
  if (!audio) return null;
  try {
    const response = await fetch(url);
    return response.ok ? await audio.decodeAudioData(await response.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

// A failed download leaves the built-in tones: the call still rings (docs/08).
export async function loadSounds(set: string, base: string): Promise<void> {
  await Promise.all(
    KINDS.map(async (kind) => {
      const buffer = await decode(`${base}${soundFile(set, kind)}`);
      if (buffer) loaded.set(kind, buffer);
    }),
  );
}

function play(buffer: AudioBuffer, loop: boolean): () => void {
  const audio = sharedAudio();
  if (!audio) return () => undefined;
  if (audio.state === 'suspended') void audio.resume();
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(audio.destination);
  source.start();
  return () => source.stop();
}

// The ring repeats without a seam until stopped; null while the set is not loaded.
export function playRing(): (() => void) | null {
  const buffer = loaded.get('ring');
  if (!buffer) return null;
  const stop = play(buffer, true);
  ringing += 1;
  return () => {
    ringing -= 1;
    stop();
  };
}

// One notification: never over a ring, never twice within a few seconds.
export function playNotify(now = Date.now()): void {
  const buffer = loaded.get('notify');
  if (!buffer || ringing > 0 || now - lastNotify < NOTIFY_GAP_MS) return;
  lastNotify = now;
  play(buffer, false);
}

// The admin Mini App lets the team listen to any set once (G54).
export async function previewSound(set: string, kind: Kind, base: string): Promise<boolean> {
  const buffer = await decode(`${base}${soundFile(set, kind)}`);
  if (buffer) play(buffer, false);
  return buffer !== null;
}

// Tests start from a clean state.
export function forgetSounds(): void {
  loaded.clear();
  ringing = 0;
  lastNotify = -Infinity;
}
