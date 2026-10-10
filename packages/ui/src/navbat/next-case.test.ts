import type { NavbatItem } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { nextCase, progressOf } from './next-case';

const item = (kind: NavbatItem['kind'], id: string, takenBy: string | null = null): NavbatItem =>
  ({ kind, id, name: id, since: 0, minutes: 1, late: false, takenBy, appeal: false }) as NavbatItem;
const ITEMS = [
  item('complaint', 'c1'),
  item('application', 'a1', 'Aziz'),
  item('application', 'a2'),
  item('face', 'f1'),
];

// The next case of «Navbat» and «N / M» (G75, docs/120).
describe('the next case', () => {
  it('is the oldest of the filter that nobody else opened', () => {
    expect(nextCase(ITEMS, 'all', [])?.id).toBe('c1');
    expect(nextCase(ITEMS, 'application', [])?.id).toBe('a2');
    expect(nextCase(ITEMS, 'all', [{ kind: 'complaint', id: 'c1' }])?.id).toBe('a2');
  });

  it('is a case opened by another member when only such are left, then nothing', () => {
    const done = [{ kind: 'application' as const, id: 'a2' }];
    expect(nextCase(ITEMS, 'application', done)?.id).toBe('a1');
    expect(nextCase(ITEMS, 'face', [{ kind: 'face', id: 'f1' }])).toBeNull();
  });

  it('counts the decided cases: «1 / 4», then «2 / 4» while the list still has the decided one', () => {
    expect(progressOf(ITEMS, 'all', [])).toEqual({ n: 1, m: 4 });
    expect(progressOf(ITEMS, 'all', [{ kind: 'complaint', id: 'c1' }])).toEqual({ n: 2, m: 4 });
    expect(progressOf(ITEMS.slice(1), 'all', [{ kind: 'complaint', id: 'c1' }])).toEqual({ n: 2, m: 4 });
    expect(progressOf(ITEMS, 'application', [])).toEqual({ n: 1, m: 2 });
  });
});
