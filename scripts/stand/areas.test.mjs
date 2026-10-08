import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AREAS, areasOf, filesOf, pickFiles } from './areas.mjs';

const SPECS = readdirSync('e2e/stand')
  .filter((name) => name.endsWith('.spec.ts'))
  .map((name) => name.replace('.spec.ts', ''));
const ALL = Object.keys(AREAS);

describe('the pieces of the stand (G71)', () => {
  it('has the eight themes of the goal and the map', () => {
    expect(ALL).toEqual([
      'registration',
      'search',
      'map',
      'booking',
      'requests',
      'driver',
      'team',
      'bots',
      'channels',
    ]);
  });

  it('gives every scenario file exactly one area', () => {
    const listed = Object.values(AREAS).flat();
    expect([...listed].sort()).toEqual([...SPECS].sort());
    expect(new Set(listed).size).toBe(listed.length);
  });

  it('--area runs the files of that area only, a list with commas runs several', () => {
    expect(pickFiles(['--area', 'requests']).files).toEqual([
      'e2e/stand/passenger-requests.spec.ts',
      'e2e/stand/requests-review.spec.ts',
      'e2e/stand/g64.spec.ts',
      'e2e/stand/g64-salon.spec.ts',
    ]);
    const two = pickFiles(['--area', 'bots,channels']);
    expect(two.areas).toEqual(['bots', 'channels']);
    expect(two.files).toEqual(filesOf(['bots', 'channels']));
  });

  it('an unknown area stops with the list of areas', () => {
    expect(() => pickFiles(['--area', 'nowhere'])).toThrow(/no area nowhere; areas: registration/);
  });

  it('files given by hand run as before', () => {
    expect(pickFiles(['e2e/stand/chat.spec.ts'])).toEqual({
      files: ['e2e/stand/chat.spec.ts'],
      areas: [],
      asked: false,
    });
  });
});

describe('what a change wakes (--changed)', () => {
  it('maps the code of a theme to its area', () => {
    expect(areasOf(['packages/ui/src/account/registration/about-step.tsx'])).toEqual(['registration']);
    expect(areasOf(['apps/backend/src/modules/ride-requests/http/routes.ts'])).toEqual(['requests']);
    expect(areasOf(['apps/miniapp-admin/src/pages/home.tsx'])).toEqual(['team']);
    expect(areasOf(['packages/ui/src/pitaks/pitak-sheet.tsx'])).toEqual(['map']);
    expect(areasOf(['apps/backend/src/modules/channels/application/zone-invite.ts'])).toEqual(['channels']);
  });

  it('a scenario file wakes its own area', () => {
    expect(areasOf(['e2e/stand/g26.spec.ts'])).toEqual(['map']);
    expect(areasOf(['e2e/stand/passenger-search.spec.ts'])).toEqual(['search']);
  });

  it('code that no rule knows wakes every area', () => {
    expect(areasOf(['packages/contracts/src/index.ts'])).toEqual(ALL);
    expect(areasOf(['e2e/stand/stand-kit.ts'])).toEqual(ALL);
  });

  it('docs, pictures, unit tests and the landing wake nothing', () => {
    expect(
      areasOf([
        'docs/75-stand.md',
        'docs/goals/g58/1-welcome.png',
        'apps/landing/src/main.ts',
        'packages/ui/src/icons.test.tsx',
      ]),
    ).toEqual([]);
  });
});
