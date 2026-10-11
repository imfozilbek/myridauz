import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// One action, one code (G77 D2, docs/11): a helper many screens share is written once. A second copy
// drifts from the first: a stale seat, the length of an hour, the link of the support said otherwise.
const ONCE = {
  isStale: /(?:function|const) isStale\b/gu,
  HOUR_MS: /(?:function|const) HOUR_MS\b/gu,
  MINUTE_MS: /(?:function|const) MINUTE_MS\b/gu,
  DAY_MS: /(?:function|const) DAY_MS\b/gu,
  useTripSteps: /(?:function|const) useTripSteps\b/gu,
  'the sign of a sum': /function useSigned\b|const signed = \(/gu,
};
// The Mini Apps open the support from one helper (G77 D2); the bots of the backend send their own buttons.
const ONCE_IN_MINI_APPS = { 'the link of the support': /t\.me\/\$\{[\w.]*support/gu };

// The code of the apps and the packages, not their tests: a test may build what it checks.
const sources = (roots) =>
  roots
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

const count = (code, pattern) => code.reduce((sum, text) => sum + (text.match(pattern)?.length ?? 0), 0);

describe('the helpers the screens share', { timeout: 20_000 }, () => {
  const code = sources(['../apps/', '../packages/']);
  const miniApps = sources(['../packages/']);
  for (const [name, pattern] of Object.entries(ONCE))
    it(`write ${name} once`, () => expect(count(code, pattern)).toBe(1));
  for (const [name, pattern] of Object.entries(ONCE_IN_MINI_APPS))
    it(`write ${name} once in the Mini Apps`, () => expect(count(miniApps, pattern)).toBe(1));
});
