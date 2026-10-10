import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { createSoundsClient } from './sounds-client';

const options = { baseUrl: 'https://api.test/', app: 'admin', initData: 'a=1' } as const;
const state = { set: '1', sets: ['1', '2', '3'], changedBy: 900, changedAt: 1 };

describe('createSoundsClient (G54)', () => {
  it('reads the set in use without a signature, and fails with the status', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json({ set: '3' }));
    expect(await createSoundsClient({ ...options, fetch }).current()).toEqual({ set: '3' });
    expect(fetch.mock.calls).toEqual([['https://api.test/public/sounds']]);
    const down = vi.fn<Fetch>(async () => new Response(null, { status: 503 }));
    await expect(createSoundsClient({ ...options, fetch: down }).current()).rejects.toBeInstanceOf(ApiError);
  });

  it('reads the admin state and picks a set, signed', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json(state));
    const client = createSoundsClient({ ...options, fetch });
    expect(await client.state()).toEqual(state);
    expect(await client.pick('1')).toEqual(state);
    expect(fetch.mock.calls.map(([url, init]) => [url, init?.method, init?.body])).toEqual([
      ['https://api.test/admin/sounds', undefined, undefined],
      ['https://api.test/admin/sounds', 'POST', JSON.stringify({ set: '1' })],
    ]);
  });
});
