import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { createChannelsClient } from './channels-client';
import type { Fetch } from './fetch';

const options = { baseUrl: 'https://api.test/', app: 'driver', initData: 'a=1' } as const;
const ID = '6f1c2f7e-3c1b-4f5e-9a3d-2b8c1d0e4f5a';
const publicity = {
  channels: [{ username: 'yol_samarqand', title: 'Samarqand', posted: true }],
  views: 4,
  link: `https://t.me/test_bot?startapp=trip_${ID}__driver`,
};

describe('the publicity of a trip in the driver app (G63, docs/119)', () => {
  it('reads the channels, the people who opened it and the link, signed', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json(publicity));
    expect(await createChannelsClient({ ...options, fetch }).tripPublicity(ID)).toEqual(publicity);
    expect(fetch.mock.calls[0]?.[0]).toBe(`https://api.test/driver/trips/${ID}/publicity`);
    expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get('x-mini-app')).toBe('driver');
  });

  it('fails with the code of the server, and on an answer that breaks the contract', async () => {
    const missing = vi.fn<Fetch>(async () => Response.json({ error: 'trips.not_found' }, { status: 404 }));
    await expect(
      createChannelsClient({ ...options, fetch: missing }).tripPublicity(ID),
    ).rejects.toBeInstanceOf(ApiError);
    const broken = vi.fn<Fetch>(async () => Response.json({ ...publicity, views: -1 }));
    await expect(createChannelsClient({ ...options, fetch: broken }).tripPublicity(ID)).rejects.toThrow();
  });
});
