// What a channel or the bot of the channels shows in Telegram (docs/180): the repository is the source,
// the Worker brings Telegram to it. A part left out is not touched.
export type Look = {
  readonly name: string;
  readonly description?: string;
  // The picture on the site of the environment.
  readonly avatar?: string;
};

// What Telegram shows now: null where nothing is set. The photo is its file_unique_id.
export type Seen = {
  readonly name: string | null;
  readonly description: string | null;
  readonly photo: string | null;
};

export type TextPart = 'name' | 'description';
const TEXT_PARTS: readonly TextPart[] = ['name', 'description'];

// The texts that differ from the repository: only they are set again.
export const textChanges = (look: Look, seen: Seen): TextPart[] =>
  TEXT_PARTS.filter((part) => look[part] !== undefined && look[part] !== seen[part]);

// Telegram makes its own file of an uploaded picture, so the two never compare. The Worker remembers
// which file of the repository (its hash) gave which photo of Telegram.
export type PhotoMemory = { readonly hash: string; readonly photo: string };

export type PhotoStep = 'keep' | 'adopt' | 'set';

// The photo stays while it is the one the file of the repository gave. A new file or a photo someone
// changed by hand is set again. A channel takes the photo it already has the first time: every new
// photo of a channel writes to all its people (docs/180).
export function photoStep(hash: string, seen: string | null, memory: PhotoMemory | null): PhotoStep {
  if (memory?.hash === hash && memory.photo === seen) return 'keep';
  if (!memory && seen) return 'adopt';
  return 'set';
}
