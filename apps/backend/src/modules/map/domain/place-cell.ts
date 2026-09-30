import type { Point } from '@platform/contracts';

// The map cut in cells of a quarter degree, about 25 km (G23): «near» is the cell of a point and
// the eight around it. The index keeps the cell of each place beside its words.
const CELLS_PER_DEGREE = 4;
const AROUND = [-1, 0, 1];

const cellOf = (lat: number, lng: number) =>
  `${Math.floor(lat * CELLS_PER_DEGREE)}x${Math.floor(lng * CELLS_PER_DEGREE)}`;

export const placeCell = ({ lat, lng }: Point) => cellOf(lat, lng);

export const nearCells = ({ lat, lng }: Point) =>
  AROUND.flatMap((row) =>
    AROUND.map((column) => cellOf(lat + row / CELLS_PER_DEGREE, lng + column / CELLS_PER_DEGREE)),
  );
