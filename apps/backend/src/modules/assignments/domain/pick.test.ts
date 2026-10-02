import { describe, expect, it } from 'vitest';
import { pickAssignee } from './pick';

const load = (today: number, lastAt: number | null) => ({ today, lastAt });

describe('pickAssignee (docs/92)', () => {
  it('gives the work to whom has the least today', () => {
    expect(
      pickAssignee(
        [1, 2, 3],
        new Map([
          [1, load(2, 10)],
          [2, load(1, 20)],
          [3, load(3, 5)],
        ]),
      ),
    ).toBe(2);
  });

  it('on a tie gives it to whom waited longest; never had any comes first', () => {
    expect(
      pickAssignee(
        [1, 2],
        new Map([
          [1, load(1, 30)],
          [2, load(1, 10)],
        ]),
      ),
    ).toBe(2);
    expect(pickAssignee([1, 2, 3], new Map([[1, load(0, 5)]]))).toBe(2);
  });

  it('keeps the team order when nothing else differs, and has nobody for an empty team', () => {
    expect(pickAssignee([5, 4], new Map())).toBe(5);
    expect(pickAssignee([], new Map())).toBeUndefined();
  });

  it('shares a day evenly: 7 in a row between 3 go 3, 2, 2', () => {
    const loads = new Map<number, { today: number; lastAt: number | null }>();
    for (let at = 1; at <= 7; at += 1) {
      const id = pickAssignee([1, 2, 3], loads) ?? 0;
      loads.set(id, load((loads.get(id)?.today ?? 0) + 1, at));
    }
    expect([...loads.values()].map((member) => member.today)).toEqual([3, 2, 2]);
  });
});
