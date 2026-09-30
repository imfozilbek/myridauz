import { MAP_WHERE_PATH, whereSchema } from '@platform/contracts';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from './app';
import { localPlaces } from './modules/map';
import { placeRow } from './modules/map/test-kit';
import { call, registerUser, testEnv } from './test-api';

const PERSON = 82;
const where = (at: string) => call(`${MAP_WHERE_PATH}?at=${at}`, PERSON);

beforeAll(async () => {
  await registerUser(PERSON);
  localPlaces.push(placeRow('Chorsu bozori', 'market', { lat: 41.3266, lng: 69.2348 }));
});

describe('the district and the name of a point on the map (G24, docs/69)', () => {
  it('answers the district by the borders and the name by the ladder, kept an hour on the phone', async () => {
    const response = await where('41.32651,69.23472');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, max-age=3600');
    expect(whereSchema.parse(await response.json())).toEqual({
      district: '1726277',
      name: { step: 'landmark', name: 'Chorsu bozori' },
    });
  });

  it('refuses a point that is not «lat,lng»', async () => {
    const response = await where('north');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'map.invalid_input' });
  });

  it('answers only a person signed in by Telegram', async () => {
    const response = await app.request(`${MAP_WHERE_PATH}?at=41.3,69.2`, {}, testEnv);
    expect(response.status).toBe(401);
  });
});
