import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from './balance.mjs';

const ALL = readdirSync('e2e/stand').filter((name) => name.endsWith('.spec.ts'));

describe('the files of the full check between the stands (G71)', () => {
  it('gives every file to exactly one stand', () => {
    const groups = balance({}, 4);
    expect(groups).toHaveLength(4);
    expect(
      groups
        .flat()
        .map((file) => file.replace('e2e/stand/', ''))
        .sort(),
    ).toEqual([...ALL].sort());
  });

  it('puts the longest file alone and evens out the rest', () => {
    const times = Object.fromEntries(ALL.map((name) => [`e2e/stand/${name}`, 1]));
    times['e2e/stand/g33.spec.ts'] = ALL.length;
    const work = balance(times, 2).map((files) => files.reduce((sum, file) => sum + times[file], 0));
    expect(balance(times, 2)[0]).toEqual(['e2e/stand/g33.spec.ts']);
    expect(Math.abs(work[0] - work[1])).toBeLessThanOrEqual(1);
  });
});
