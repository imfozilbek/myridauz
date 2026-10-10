import { SHOWN_PITAK_STATUSES, type PitakStatus, type Point } from '@platform/contracts';

// A pitak (docs/72): a place where cars wait for people to one direction. The region comes from
// the point; people see a pitak only when Claude chose it or people checked it.
export type PitakRecord = {
  readonly id: string;
  readonly name: string;
  // Where exactly to stand, «Metro 2-chiqish yonida» (G76); null until the team writes it.
  readonly hint: string | null;
  readonly point: Point;
  readonly regionId: string;
  readonly status: PitakStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
};

// A live direction «region A → region B» and its main pitak (owner decision 30.09.2026).
export type DirectionRecord = {
  readonly from: string;
  readonly to: string;
  readonly pitakId: string | null;
  readonly updatedAt: number;
};

export const shown = (pitak: PitakRecord) => SHOWN_PITAK_STATUSES.includes(pitak.status);

// A pitak of a direction lies in the region the direction starts from.
export const fitsDirection = (pitak: PitakRecord, direction: Pick<DirectionRecord, 'from'>) =>
  pitak.regionId === direction.from;
