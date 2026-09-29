import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { createDriversClient } from './drivers-client';
import type { Fetch } from './fetch';
import { createModerationClient } from './moderation-client';

const options = { baseUrl: 'https://api.test', app: 'driver', initData: 'a=1' } as const;
const car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  plate: '01A123BC',
  seats: 4,
} as const;
const application = {
  status: 'pending',
  car,
  photos: { front: true, side: true, interior: true },
  reasons: [],
};
const summary = { userId: 5, firstName: 'Ali', status: 'pending', car, reasons: [], submittedAt: 1 };

describe('createDriversClient', () => {
  it('reads, uploads and submits the own application, signed', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json({ application }));
    const client = createDriversClient({ ...options, fetch });
    expect(await client.getApplication()).toEqual(application);
    await client.uploadPhoto('front', new Blob(['x'], { type: 'image/jpeg' }));
    await client.submit(car);
    expect(fetch.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ['https://api.test/driver/application', undefined],
      ['https://api.test/driver/application/photos/front', 'PUT'],
      ['https://api.test/driver/application', 'POST'],
    ]);
    expect(fetch.mock.calls[0]?.[1]?.headers).toMatchObject({
      authorization: 'tma a=1',
      'x-mini-app': 'driver',
    });
  });

  it('turns an API error into ApiError', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json({ error: 'drivers.incomplete' }, { status: 409 }));
    await expect(createDriversClient({ ...options, fetch }).submit(car)).rejects.toEqual(
      new ApiError(409, 'drivers.incomplete'),
    );
  });
});

describe('createModerationClient', () => {
  it('lists, decides and blocks for the team', async () => {
    const fetch = vi
      .fn<Fetch>()
      .mockResolvedValueOnce(Response.json({ applications: [summary] }))
      .mockResolvedValueOnce(Response.json(summary))
      .mockResolvedValueOnce(Response.json({ ...summary, status: 'approved' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(new Blob(['x'])));
    const client = createModerationClient({ ...options, app: 'admin', fetch });
    expect(await client.queue()).toEqual([summary]);
    expect(await client.get(5)).toEqual(summary);
    expect((await client.decide(5, { action: 'approve' })).status).toBe('approved');
    await client.block(5, 7);
    expect((await client.photo(5, 'avatar')).size).toBe(1);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.test/admin/applications',
      'https://api.test/admin/applications/5',
      'https://api.test/admin/applications/5/decision',
      'https://api.test/admin/users/5/block',
      'https://api.test/admin/applications/5/photos/avatar',
    ]);
  });
});
