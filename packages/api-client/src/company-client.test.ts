import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { createCompanyClient } from './company-client';
import type { Fetch } from './fetch';

const options = { baseUrl: 'https://api.test/', app: 'admin', initData: 'a=1' } as const;
const company = {
  legalName: 'Yoʻldosh',
  form: 'MChJ',
  stir: '123456789',
  address: 'Toshkent shahri',
  email: 'info@example.uz',
};
const state = {
  current: { version: 1, company, changedBy: 900, changedAt: 1 },
  history: [{ version: 1, company, changedBy: 900, changedAt: 1 }],
};

describe('createCompanyClient (G34)', () => {
  it('reads the public requisites without a signature', async () => {
    const answer = { company: null, edition: { version: '1.1', date: '2026-10-02' } };
    const fetch = vi.fn<Fetch>(async () => Response.json(answer));
    expect(await createCompanyClient({ ...options, fetch }).current()).toEqual(answer);
    expect(fetch.mock.calls).toEqual([
      ['https://api.test/public/company', { signal: expect.any(AbortSignal) }],
    ]);
  });

  it('fails with the status when the public answer fails', async () => {
    const fetch = vi.fn<Fetch>(async () => new Response(null, { status: 503 }));
    await expect(createCompanyClient({ ...options, fetch }).current()).rejects.toBeInstanceOf(ApiError);
  });

  it('reads and saves the admin state, signed', async () => {
    const fetch = vi.fn<Fetch>(async () => Response.json(state));
    const client = createCompanyClient({ ...options, fetch });
    expect(await client.state()).toEqual(state);
    expect(await client.save(company)).toEqual(state);
    expect(fetch.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ['https://api.test/admin/company', undefined],
      ['https://api.test/admin/company', 'POST'],
    ]);
    expect(fetch.mock.calls[1]?.[1]?.headers).toMatchObject({ authorization: 'tma a=1' });
  });
});
