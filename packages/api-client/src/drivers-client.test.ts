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
const PERSON = '0123456789abcdef0123456789abcdef';
const summary = { userId: PERSON, firstName: 'Ali', status: 'pending', car, reasons: [], submittedAt: 1 };

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
  it('lists, decides, blocks and unblocks for the team', async () => {
    const detail = { ...summary, history: [], samePlate: 1 };
    const journal = { active: null, entries: [] };
    const fetch = vi
      .fn<Fetch>()
      .mockResolvedValueOnce(Response.json({ applications: [summary] }))
      .mockResolvedValueOnce(Response.json(detail))
      .mockResolvedValueOnce(Response.json({ ...summary, status: 'approved' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(new Blob(['x'])))
      .mockResolvedValueOnce(Response.json(journal))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createModerationClient({ ...options, app: 'admin', fetch });
    expect(await client.queue()).toEqual([summary]);
    expect(await client.get(PERSON)).toEqual(detail);
    expect((await client.decide(PERSON, { action: 'approve' })).status).toBe('approved');
    await client.block(PERSON, 7);
    expect((await client.photo(PERSON, 'avatar')).size).toBe(1);
    expect(await client.blocks(PERSON)).toEqual(journal);
    await client.unblock(PERSON);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.test/admin/applications',
      `https://api.test/admin/applications/${PERSON}`,
      `https://api.test/admin/applications/${PERSON}/decision`,
      `https://api.test/admin/users/${PERSON}/block`,
      `https://api.test/admin/applications/${PERSON}/photos/avatar`,
      `https://api.test/admin/users/${PERSON}/blocks`,
      `https://api.test/admin/users/${PERSON}/unblock`,
    ]);
  });
});

describe('the face photos for the team (G51)', () => {
  it('lists new photos, loads one and decides it', async () => {
    const face = { userId: PERSON, firstName: 'Ali', uploadedAt: 5 };
    const fetch = vi
      .fn<Fetch>()
      .mockResolvedValueOnce(Response.json({ faces: [face] }))
      .mockResolvedValueOnce(new Response(new Blob(['xy'])))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createModerationClient({ ...options, app: 'admin', fetch });
    expect(await client.faces()).toEqual([face]);
    expect((await client.facePhoto(PERSON)).size).toBe(2);
    await client.decideFace(PERSON, { action: 'reject', reason: 'not_one_person' });
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.test/admin/faces',
      `https://api.test/admin/faces/${PERSON}/photo`,
      `https://api.test/admin/faces/${PERSON}/decision`,
    ]);
    expect(fetch.mock.calls[2]?.[1]).toMatchObject({
      method: 'POST',
      body: '{"action":"reject","reason":"not_one_person"}',
    });
  });
});
