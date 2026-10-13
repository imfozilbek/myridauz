import {
  photoStep,
  textChanges,
  type Look,
  type PhotoMemory,
  type Seen,
  type TextPart,
} from '../domain/look';

// One bot or channel in Telegram: its look in the repository and the calls that read and set it.
export type Face = {
  readonly key: string;
  readonly look: Look;
  // The most calls one check makes: a run keeps within its budget of requests (docs/117).
  readonly cost: number;
  // A channel takes the photo it already has (docs/180); a bot gets the photo of the repository.
  readonly adopt: boolean;
  read(): Promise<Seen>;
  write(part: TextPart, text: string): Promise<void>;
  // Sets the picture and gives the photo Telegram made of it.
  photo(picture: ArrayBuffer): Promise<string | null>;
};

// What the Worker last checked of a face, and the photo it gave or took.
export type LookRow = {
  readonly key: string;
  readonly checkedAt: number;
  readonly memory: PhotoMemory | null;
};
export type LookStore = { rows(): Promise<LookRow[]>; save(row: LookRow): Promise<void> };

export type LooksDeps = {
  readonly faces: readonly Face[];
  readonly store: LookStore;
  readonly picture: (url: string) => Promise<ArrayBuffer>;
  readonly hash: (bytes: ArrayBuffer) => Promise<string>;
  readonly now: () => number;
};

async function keepPhoto(deps: LooksDeps, face: Face, seen: string | null, memory: PhotoMemory | null) {
  if (!face.look.avatar) return memory;
  const picture = await deps.picture(face.look.avatar);
  const hash = await deps.hash(picture);
  const step = photoStep(hash, seen, memory, face.adopt);
  if (step === 'keep') return memory;
  const photo = step === 'adopt' ? seen : await face.photo(picture);
  return photo ? { hash, photo } : null;
}

// One check of a face: only what differs from the repository is set, nothing «just in case».
async function keepLook(deps: LooksDeps, face: Face, memory: PhotoMemory | null) {
  const seen = await face.read();
  for (const part of textChanges(face.look, seen)) await face.write(part, face.look[part] ?? '');
  return keepPhoto(deps, face, seen.photo, memory);
}

// A run checks the faces checked the longest ago, never checked first, while its budget of calls
// lasts. A failed check (no right to change the channel) waits for the next round, the rest goes on.
export async function keepLooks(deps: LooksDeps, budget: number): Promise<string[]> {
  const rows = new Map((await deps.store.rows()).map((row) => [row.key, row]));
  const due = [...deps.faces].sort(
    (a, b) => (rows.get(a.key)?.checkedAt ?? 0) - (rows.get(b.key)?.checkedAt ?? 0),
  );
  const checked: string[] = [];
  let left = budget;
  for (const face of due) {
    if (face.cost > left) break;
    left -= face.cost;
    const before = rows.get(face.key)?.memory ?? null;
    const memory = await keepLook(deps, face, before).catch((error: unknown) => {
      console.warn(JSON.stringify({ event: 'look_failed', face: face.key, message: String(error) }));
      return before;
    });
    await deps.store.save({ key: face.key, checkedAt: deps.now(), memory });
    checked.push(face.key);
  }
  return checked;
}

// The faces not checked since a moment: setup-bots runs rounds until none is left (docs/45).
export async function uncheckedSince(deps: LooksDeps, since: number): Promise<number> {
  const rows = new Map((await deps.store.rows()).map((row) => [row.key, row.checkedAt]));
  return deps.faces.filter((face) => (rows.get(face.key) ?? 0) < since).length;
}
