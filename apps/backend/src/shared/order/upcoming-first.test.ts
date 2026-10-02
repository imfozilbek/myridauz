import { describe, expect, it } from 'vitest';
import { upcomingFirst } from './upcoming-first';

describe('"Mening safarlarim" order (docs/65 B6)', () => {
  it('puts the trips ahead first, nearest on top, then the past ones, latest on top', () => {
    const at = [50, 5, 30, 20, 1, 40];
    expect(upcomingFirst(at, (x) => x, 25)).toEqual([30, 40, 50, 20, 5, 1]);
  });

  it('keeps a trip on the road on top until it arrives (docs/90 F-D3)', () => {
    const trips = [
      { departAt: 30, endsAt: 35 },
      { departAt: 20, endsAt: 28 },
      { departAt: 5, endsAt: 10 },
    ];
    const order = upcomingFirst(
      trips,
      (trip) => trip.departAt,
      25,
      (trip) => trip.endsAt,
    );
    expect(order.map((trip) => trip.departAt)).toEqual([20, 30, 5]);
  });
});
