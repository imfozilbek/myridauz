import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import type { Face, LooksDeps } from './application/looks';
import { looksRoutes, ROUND_BUDGET } from './http/looks-routes';
import { d1Looks } from './infrastructure/d1-looks';

const NOW = Date.parse('2026-10-13T19:30:00Z');
const SECRET = 'hook';

const face = (key: string): Face => ({
  key,
  look: { name: key, avatar: 'https://site.uz/a.jpg' },
  cost: ROUND_BUDGET / 2,
  adopt: true,
  read: async () => ({ name: null, description: null, short: null, photo: null }),
  write: async () => undefined,
  photo: async () => `photo-${key}`,
});

function setup() {
  const deps: LooksDeps = {
    faces: ['a', 'b', 'c'].map(face),
    store: d1Looks(testD1()),
    picture: async () => new Uint8Array([1]).buffer,
    hash: async () => 'h1',
    now: () => NOW,
  };
  const routes = looksRoutes(() => deps);
  const round = (secret = SECRET, since = String(NOW)) =>
    routes.request(
      `/telegram/looks?since=${since}`,
      { method: 'POST', headers: { 'x-setup-secret': secret } },
      { TELEGRAM_WEBHOOK_SECRET: SECRET },
    );
  return { deps, round };
}

// docs/180: setup-bots runs rounds until every bot and channel is checked.
describe('POST /telegram/looks', () => {
  it('checks as many faces as one round may and tells how many are left', async () => {
    const { deps, round } = setup();
    expect(await (await round()).json()).toEqual({ checked: ['a', 'b'], left: 1 });
    expect(await (await round()).json()).toEqual({ checked: ['c', 'a'], left: 0 });
    const rows = (await deps.store.rows()).sort((one, other) => one.key.localeCompare(other.key));
    expect(rows.map(({ key, memory }) => [key, memory])).toEqual([
      ['a', { hash: 'h1', photo: 'photo-a' }],
      ['b', { hash: 'h1', photo: 'photo-b' }],
      ['c', { hash: 'h1', photo: 'photo-c' }],
    ]);
  });

  it('refuses without the secret and without the moment of the start', async () => {
    const { round } = setup();
    expect((await round('nope')).status).toBe(401);
    expect((await round(SECRET, 'soon')).status).toBe(400);
  });
});
