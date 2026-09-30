import { describe, expect, it } from 'vitest';
import { upcomingFirst } from './upcoming-first';

describe('"Mening safarlarim" order (docs/65 B6)', () => {
  it('puts the trips ahead first, nearest on top, then the past ones, latest on top', () => {
    const at = [50, 5, 30, 20, 1, 40];
    expect(upcomingFirst(at, (x) => x, 25)).toEqual([30, 40, 50, 20, 5, 1]);
  });
});
