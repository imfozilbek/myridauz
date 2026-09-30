import type { Point } from '@platform/contracts';

// The map cut in cells (G23, G24): «near» is the cell of a point and the eight around it. The index
// keeps both cells of each place beside its words. A quarter degree (about 25 km) is for the
// search by name, a hundredth (about 1 km) for the name of a point (docs/69).
const QUARTER = 4;
const HUNDREDTH = 100;
const AROUND = [-1, 0, 1];

const cellOf = (perDegree: number) => (lat: number, lng: number) =>
  `${Math.floor(lat * perDegree)}x${Math.floor(lng * perDegree)}`;

const around = (perDegree: number) => {
  const cell = cellOf(perDegree);
  return ({ lat, lng }: Point) =>
    AROUND.flatMap((row) => AROUND.map((column) => cell(lat + row / perDegree, lng + column / perDegree)));
};

export const placeCell = ({ lat, lng }: Point) => cellOf(QUARTER)(lat, lng);
export const fineCell = ({ lat, lng }: Point) => cellOf(HUNDREDTH)(lat, lng);
export const nearCells = around(QUARTER);
export const nearFineCells = around(HUNDREDTH);
