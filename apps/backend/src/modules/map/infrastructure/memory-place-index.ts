import type { Point } from '@platform/contracts';
import type { PlaceIndex } from '../application/ports';
import type { PlaceRow } from './place-rows';

// The search index in memory for tests: the same rules as FTS in D1. Every word asked starts a
// word of the place; nearest first, or the shortest names first.
const flatDistance = (near: Point) => {
  const scale = Math.cos((near.lat * Math.PI) / 180);
  return ({ point }: PlaceRow) => ((point.lng - near.lng) * scale) ** 2 + (point.lat - near.lat) ** 2;
};

const first = (rows: PlaceRow[], order: (row: PlaceRow) => number, limit: number) =>
  rows
    .sort((a, b) => order(a) - order(b))
    .slice(0, limit)
    .map(({ name, kind, area, district, point }) => ({ name, kind, area, district, point }));

export const memoryPlaceIndex = (rows: readonly PlaceRow[]): PlaceIndex => ({
  find: async ({ words, cells, near, districts }, limit) => {
    const order = near ? flatDistance(near) : (row: PlaceRow) => row.name.length;
    const matched = rows
      .filter((row) => cells === null || cells.includes(row.cell))
      .filter((row) => districts === null || (row.district !== null && districts.includes(row.district)))
      .filter((row) => {
        const own = row.words.split(' ');
        return words.every((word) => own.some((mine) => mine.startsWith(word)));
      });
    return first(matched, order, limit);
  },
  around: async ({ cells, kinds, near }, limit) => {
    const matched = rows.filter((row) => cells.list.includes(row[cells.column]) && kinds.includes(row.kind));
    return first(matched, flatDistance(near), limit);
  },
});
