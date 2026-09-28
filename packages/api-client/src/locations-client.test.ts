import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { createLocationsClient } from './locations-client';

const directory = {
  version: '1',
  locations: [
    { id: '1726', parentId: null, type: 'region', name: 'Toshkent shahri', lat: 41, lng: 69, oneCity: true },
  ],
};

describe('createLocationsClient', () => {
  it('loads the directory once per session', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json(directory));
    const client = createLocationsClient({ baseUrl: 'https://api.test/api', fetch });
    expect(await client.getLocations()).toEqual(directory);
    await client.getLocations();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://api.test/api/locations');
  });

  it('asks again after a failure', async () => {
    const fetch = vi
      .fn<Fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json(directory));
    const client = createLocationsClient({ baseUrl: 'https://api.test', fetch });
    await expect(client.getLocations()).rejects.toEqual(new ApiError(503));
    expect(await client.getLocations()).toEqual(directory);
  });
});
