import { MAP_SEARCH_PATH, placeSearchSchema } from '@platform/contracts';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from './app';
import { localPlaces } from './modules/map';
import { placeRow } from './modules/map/test-kit';
import { call, registerUser, testEnv } from './test-api';

const PERSON = 81;
const search = async (query: string) => {
  const response = await call(`${MAP_SEARCH_PATH}?${query}`, PERSON);
  return { response, places: placeSearchSchema.parse(await response.json()).places };
};

beforeAll(async () => {
  await registerUser(PERSON);
  localPlaces.push(
    placeRow(
      'Chorsu bozori',
      'market',
      { lat: 41.3265, lng: 69.2355 },
      {
        area: 'Shayxontohur',
        district: '1726277',
        words: 'charsu bazari',
      },
    ),
    placeRow('Chorsu', 'mahalla', { lat: 39.65, lng: 66.96 }, { area: 'Samarqand', words: 'charsu' }),
  );
});

describe('the search of places on the map (G23, docs/67)', () => {
  it('finds a place written in Cyrillic, near the start of the trip first', async () => {
    const { response, places } = await search(`q=${encodeURIComponent('Чорсу')}&near=41.3111,69.2797`);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, max-age=3600');
    expect(places.map((place) => place.name)).toEqual(['Chorsu bozori', 'Chorsu']);
    expect(places[0]).toMatchObject({ kind: 'market', area: 'Shayxontohur', district: '1726277' });
  });

  it('starts from Samarkand when the trip starts there, and takes a wrong start as none', async () => {
    const near = await search('q=chorsu&near=39.65,66.97');
    expect(near.places[0]?.name).toBe('Chorsu');
    const wrong = await search('q=chorsu&near=north');
    expect(wrong.places.map((place) => place.name)).toEqual(['Chorsu', 'Chorsu bozori']);
  });

  it('finds only inside the zone of the booking, the whole city for Toshkent (G26, docs/74)', async () => {
    const city = await search('q=chorsu&near=39.65,66.97&zone=1726');
    expect(city.places.map((place) => place.name)).toEqual(['Chorsu bozori']);
    const district = await search('q=chorsu&zone=1726277');
    expect(district.places.map((place) => place.name)).toEqual(['Chorsu bozori']);
    expect((await search('q=chorsu&zone=1730401')).places).toEqual([]);
    const unknown = await call(`${MAP_SEARCH_PATH}?q=chorsu&zone=99`, PERSON);
    expect(unknown.status).toBe(400);
  });

  it('gives nothing for one letter', async () => {
    expect((await search('q=c')).places).toEqual([]);
    expect((await search('near=41.3,69.2')).places).toEqual([]);
  });

  it('answers only a person signed in by Telegram', async () => {
    const response = await app.request(`${MAP_SEARCH_PATH}?q=chorsu`, {}, testEnv);
    expect(response.status).toBe(401);
  });
});
