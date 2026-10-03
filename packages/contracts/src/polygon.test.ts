import { describe, expect, it } from 'vitest';
import { insideParts, pointInside } from './polygon';

// A crescent: the center of its box lies in the bite, outside the place.
const CRESCENT = [
  [
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 3],
      [3, 3],
      [3, 1],
      [0, 1],
      [0, 0],
    ],
  ],
];

describe('a point surely inside a place (G35)', () => {
  it('takes the center of the box when it is inside', () => {
    const square = [
      [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
      ],
    ];
    expect(pointInside(square)).toEqual({ lat: 1, lng: 1 });
  });

  it('finds the inside of a place whose center is outside it', () => {
    expect(insideParts(CRESCENT, { lat: 2, lng: 2 })).toBe(false);
    const point = pointInside(CRESCENT);
    expect(point && insideParts(CRESCENT, point)).toBe(true);
  });

  it('has none for an empty border', () => {
    expect(pointInside([])).toBeNull();
  });
});
