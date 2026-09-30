import { borderSchema, MAP_WHERE_PATH, mapBorderPath, whereSchema } from '@platform/contracts';
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
      area: { step: 'district', name: 'Shayxontohur' },
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

describe('the border of a district for its map (G24, docs/71)', () => {
  it('gives the rings of the district, and 404 for an unknown one', async () => {
    const response = await call(mapBorderPath('1726277'), PERSON);
    expect(response.status).toBe(200);
    const border = borderSchema.parse(await response.json());
    expect(border.parts[0]?.[0]?.length).toBeGreaterThan(10);
    expect((await call(mapBorderPath('1726999'), PERSON)).status).toBe(404);
  });
});
