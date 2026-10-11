import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The dead code of the old main screen, removed in G77 (D1): it ran only on the main screen of the
// team and showed nothing there. It stays removed: a name back is dead code back (docs/11).
const REMOVED = [
  'ActionTile',
  'FaceNotice',
  'HomeNote',
  'FavoriteCell',
  'useList',
  'nextTrips',
  'lastTrip',
  'againOf',
  'useLive',
  'waitsApproval',
  'paleUntilApproval',
];

// The code of the apps and the packages, not their tests.
const sources = () =>
  ['../apps/', '../packages/']
    .map((root) => new URL(root, import.meta.url))
    .flatMap((root) => readdirSync(root).map((name) => new URL(`${name}/src/`, root)))
    .flatMap((src) => {
      try {
        return readdirSync(src, { recursive: true, encoding: 'utf8' }).map((name) => new URL(name, src));
      } catch {
        return [];
      }
    })
    .filter((file) => /\.tsx?$/u.test(file.pathname) && !/test/u.test(file.pathname.split('/').at(-1)))
    .map((file) => readFileSync(file, 'utf8'));

describe('the dead code of the old main screen', { timeout: 20_000 }, () => {
  const code = sources().join('\n');
  for (const name of REMOVED)
    // Defined again: a function, a value, a component or a field of a type (a word in a text is not).
    it(`has no ${name}`, () => {
      const defined = new RegExp(`\\b(?:function|const|class)\\s+${name}\\b|\\b${name}\\??:`, 'u');
      expect(defined.test(code)).toBe(false);
    });
});
