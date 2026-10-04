// Ports of the sounds module (docs/115): D1 in production, memory in tests.
export type SoundPick = { readonly set: string; readonly changedBy: number; readonly changedAt: number };

export type SoundRepository = {
  // The newest pick; null until the owner picks a set (migrations/0038_sound_choices.sql).
  latest(): Promise<SoundPick | null>;
  add(set: string, changedBy: number, at: number): Promise<void>;
};

export type SoundsDeps = {
  readonly sounds: SoundRepository;
  // The sets of the brand and the one that plays until the owner picks (brands/<brand>/brand.config.ts).
  readonly sets: readonly string[];
  readonly defaultSet: string;
  readonly now: () => number;
};
