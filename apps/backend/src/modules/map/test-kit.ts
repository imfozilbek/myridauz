import type { PlaceKind, Point } from '@platform/contracts';
import { fineCell, placeCell } from './domain/place-cell';
import type { PlaceRow } from './infrastructure/place-rows';

// A place of the search index for tests: the cells come from the point, like pnpm map-data does.
export const placeRow = (
  name: string,
  kind: PlaceKind,
  point: Point,
  over: Partial<Omit<PlaceRow, 'cell' | 'fine' | 'point'>> = {},
): PlaceRow => ({
  name,
  kind,
  district: null,
  area: null,
  point,
  words: name.toLowerCase(),
  cell: placeCell(point),
  fine: fineCell(point),
  ...over,
});
