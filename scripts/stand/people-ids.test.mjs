import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Every person of the stand is one Telegram ID with one name (lesson 211, G75): two files with the same
// ID and different names see each other's trips when the whole stand runs.
const PERSON = /\{ id: (\d{6,}), name: '([^']+)'/gu;

describe('the people of the stand', () => {
  it('never give one Telegram ID to two people', () => {
    const names = new Map();
    for (const file of readdirSync('e2e/stand').filter((name) => name.endsWith('.ts')))
      for (const [, id, name] of readFileSync(`e2e/stand/${file}`, 'utf8').matchAll(PERSON)) {
        const known = names.get(id) ?? new Set();
        names.set(id, known.add(name));
      }
    const twice = [...names]
      .filter(([, known]) => known.size > 1)
      .map(([id, known]) => `${id}: ${[...known]}`);
    expect(twice).toEqual([]);
  });
});
