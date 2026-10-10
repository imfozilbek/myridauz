import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { createLimitsClient } from './limits-client';

const options = { baseUrl: 'https://api.test/', app: 'admin', initData: 'a=1' } as const;
const state = { limits: [{ key: 'bookings.maxPending', value: 2, base: 3 }], history: [] };

describe('createLimitsClient (G75, docs/128 §4)', () => {
  it("reads the owner's values without a signature, and fails with the status", async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json({ values: { 'bookings.maxPending': 2 } }));
    expect(await createLimitsClient({ ...options, fetch }).current()).toEqual({
      values: { 'bookings.maxPending': 2 },
    });
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.test/public/limits');
    const down = vi.fn<Fetch>(async () => new Response(null, { status: 503 }));
    await expect(createLimitsClient({ ...options, fetch: down }).current()).rejects.toBeInstanceOf(ApiError);
  });

  it('reads all limits and changes one, signed', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json(state));
    const client = createLimitsClient({ ...options, fetch });
    expect(await client.state()).toEqual(state);
    expect(await client.change('bookings.maxPending', 2)).toEqual(state);
    expect(fetch.mock.calls.map(([url, init]) => [url, init?.method, init?.body])).toEqual([
      ['https://api.test/admin/limits', undefined, undefined],
      ['https://api.test/admin/limits/bookings.maxPending', 'PUT', JSON.stringify({ value: 2 })],
    ]);
  });
});
