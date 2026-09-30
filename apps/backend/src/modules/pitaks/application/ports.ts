import type { Point } from '@platform/contracts';
import type { DirectionRecord, PitakRecord } from '../domain/pitak';

// Ports of the pitaks (docs/72): D1 in production, memory in tests.
export type PitakChangeRecord = {
  readonly subject: string;
  readonly before: string | null;
  readonly after: string | null;
  readonly by: number;
  readonly at: number;
};

export type PitakRepository = {
  all(): Promise<PitakRecord[]>;
  find(id: string): Promise<PitakRecord | undefined>;
  save(pitak: PitakRecord): Promise<void>;
  directions(): Promise<DirectionRecord[]>;
  direction(from: string, to: string): Promise<DirectionRecord | undefined>;
  saveDirection(direction: DirectionRecord): Promise<void>;
  removeDirection(from: string, to: string): Promise<boolean>;
  log(change: PitakChangeRecord): Promise<void>;
  history(limit: number): Promise<PitakChangeRecord[]>;
};

export type PitaksDeps = {
  readonly store: PitakRepository;
  // The region of a point by the borders; null abroad (G24).
  readonly regionOf: (point: Point) => string | null;
  readonly isRegion: (id: string) => boolean;
  readonly now: () => number;
  readonly newId: () => string;
};
