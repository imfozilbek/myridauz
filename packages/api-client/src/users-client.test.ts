import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { createUsersClient } from './users-client';

const profile = {
  id: '00000000000000000000000000000001',
  firstName: 'Ali',
  gender: 'male',
  phone: '+998',
  roles: ['passenger'],
  hasAvatar: false,
  avatarStatus: null,
  avatarReason: null,
  writeAccess: false,
  joinedAt: Date.parse('2026-08-09T00:00:00Z'),
  rating: null,
};

function setup(response: Response) {
  const fetch = vi.fn<Fetch>(async () => response);
  const client = createUsersClient({
    baseUrl: 'https://api.test/api',
    fetch,
    app: 'driver',
    initData: 'a=1',
  });
  return { client, fetch };
}

describe('createUsersClient', () => {
  it('signs every call with the Telegram launch data of its Mini App', async () => {
    const me = { state: 'active', profile };
    const { client, fetch } = setup(Response.json(me));
    expect(await client.getMe()).toEqual(me);
    expect(fetch).toHaveBeenCalledWith('https://api.test/api/me', {
      headers: { authorization: 'tma a=1', 'x-mini-app': 'driver' },
      signal: expect.any(AbortSignal),
    });
  });

  it('sends the registration, the photo and the write access answer', async () => {
    const { client, fetch } = setup(Response.json({ state: 'active', profile }));
    await client.register({ consent: true, firstName: 'Ali', gender: 'male', contact: 'c' });
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.test/api/me/registration');
    await client.uploadAvatar(new Blob(['x'], { type: 'image/jpeg' }));
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({
      method: 'PUT',
      headers: { 'content-type': 'image/jpeg' },
    });
    await client.setWriteAccess(true);
    expect(fetch.mock.calls[2]?.[1]).toMatchObject({ method: 'POST', body: '{"allowed":true}' });
  });

  it('loads a photo as a blob', async () => {
    const { client } = setup(new Response('img', { headers: { 'content-type': 'image/jpeg' } }));
    expect((await client.getAvatar('0123456789abcdef0123456789abcdef')).size).toBe(3);
  });

  it('turns API errors into codes', async () => {
    const blocked = setup(Response.json({ error: 'users.blocked' }, { status: 403 }));
    await expect(blocked.client.getMe()).rejects.toEqual(new ApiError(403, 'users.blocked'));
    const broken = setup(new Response('oops', { status: 500 }));
    await expect(broken.client.getMe()).rejects.toMatchObject({ status: 500, code: undefined });
  });

  it('reports every error answer with its code (G12)', async () => {
    const errors: string[] = [];
    const fetch = vi.fn<Fetch>(async () => Response.json({ error: 'users.blocked' }, { status: 403 }));
    const client = createUsersClient({
      baseUrl: 'https://api.test',
      fetch,
      app: 'driver',
      initData: 'a=1',
      onError: (code) => errors.push(code),
    });
    await expect(client.getMe()).rejects.toEqual(new ApiError(403, 'users.blocked'));
    expect(errors).toEqual(['users.blocked']);
  });
});
