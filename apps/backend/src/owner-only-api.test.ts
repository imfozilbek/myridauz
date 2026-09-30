import {
  ADMIN_CHANNELS_PATH,
  ADMIN_DIRECTIONS_PATH,
  ADMIN_PRICING_PATH,
  ADMIN_PRICING_ROLLBACK_PATH,
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
  it('refuses a moderator and lets the owner through, reading stays open to the team', async () => {
    expect(await changeModerator(testEnv, OWNER, MODERATOR, true)).toBe('ok');
    for (const [path, init] of CHANGES) {
      const refused = await call(path, MODERATOR, init);
      expect([path, refused.status, await refused.json()]).toEqual([path, 403, { error: 'auth.not_owner' }]);
      expect([path, (await call(path, OWNER, init)).status]).not.toEqual([path, 403]);
    }
    expect((await call(ADMIN_PRICING_PATH, MODERATOR, { app: 'admin' })).status).toBe(200);
    expect((await call(ADMIN_CHANNELS_PATH, MODERATOR, { app: 'admin' })).status).toBe(200);
  });
});
