import {
  ADMIN_CHANNELS_PATH,
  ADMIN_COMPANY_PATH,
  ADMIN_DIRECTIONS_PATH,
  ADMIN_PITAK_DIRECTIONS_PATH,
  ADMIN_PITAK_HISTORY_PATH,
  ADMIN_PITAKS_PATH,
  ADMIN_PRICING_PATH,
  ADMIN_PRICING_PREVIEW_PATH,
  ADMIN_PRICING_ROLLBACK_PATH,
  ADMIN_SOUNDS_PATH,
  ADMIN_STATS_PATH,
  ADMIN_WALLETS_PATH,
  LOCATION_DISTANCE_PATH,
} from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { changeModerator } from './modules/team';
import { call, testEnv } from './test-api';

const OWNER = 900;
const MODERATOR = 905;
const json = (method: string, body: unknown) => ({
  app: 'admin',
  method,
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});
const CHANGES: readonly [string, ReturnType<typeof json>][] = [
  [ADMIN_PRICING_PATH, json('POST', {})],
  [ADMIN_PRICING_ROLLBACK_PATH, json('POST', { version: 1 })],
  [ADMIN_DIRECTIONS_PATH, json('PUT', {})],
  [LOCATION_DISTANCE_PATH, json('PUT', { from: '1726', to: '1718', km: 300 })],
  [`${ADMIN_CHANNELS_PATH}/zone_test`, json('PUT', {})],
  [`${ADMIN_CHANNELS_PATH}/zone_test`, json('DELETE', {})],
];

describe('only the owner changes prices, distances and channels (docs/02, docs/65 A6)', () => {
  it('refuses a moderator and lets the owner through', async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    for (const [path, init] of CHANGES) {
      const refused = await call(path, MODERATOR, init);
      expect([path, refused.status, await refused.json()]).toEqual([path, 403, { error: 'auth.not_owner' }]);
      expect([path, (await call(path, OWNER, init)).status]).not.toEqual([path, 403]);
    }
  });
});

const READ = { app: 'admin' };
// «Boshqaruv» is the owner's: a moderator has the queue, «Statistika» and the channels to read
// (owner decision 06.10.2026, docs/120); the server says so too, not only the screen (G75).
const OWNERS: readonly [string, typeof READ | ReturnType<typeof json>][] = [
  [ADMIN_PRICING_PATH, READ],
  [ADMIN_DIRECTIONS_PATH, READ],
  [ADMIN_PRICING_PREVIEW_PATH, json('POST', {})],
  [ADMIN_WALLETS_PATH, READ],
  [`${ADMIN_WALLETS_PATH}/1`, READ],
  [ADMIN_PITAKS_PATH, READ],
  [ADMIN_PITAK_HISTORY_PATH, READ],
  [ADMIN_PITAKS_PATH, json('POST', {})],
  [ADMIN_PITAK_DIRECTIONS_PATH, json('PUT', {})],
  [ADMIN_COMPANY_PATH, READ],
  [ADMIN_SOUNDS_PATH, READ],
];

describe('a moderator does not open «Boshqaruv» (docs/120, G75)', () => {
  it("reads only «Statistika» and the channels; the rest is the owner's", async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    for (const [path, init] of OWNERS) {
      const refused = await call(path, MODERATOR, init);
      expect([path, refused.status, await refused.json()]).toEqual([path, 403, { error: 'auth.not_owner' }]);
      expect([path, (await call(path, OWNER, init)).status]).not.toEqual([path, 403]);
    }
    expect((await call(`${ADMIN_STATS_PATH}?period=day`, MODERATOR, READ)).status).toBe(200);
    expect((await call(ADMIN_CHANNELS_PATH, MODERATOR, READ)).status).toBe(200);
  });
});
