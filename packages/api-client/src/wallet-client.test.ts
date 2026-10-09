import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import type { Fetch } from './fetch';
import { createWalletClient } from './wallet-client';

const options = { baseUrl: 'https://api.test/', app: 'driver', initData: 'a=1' } as const;

describe('the details of a commission in «Hamyon» (G65, mockup g65/2)', () => {
  it('reads one operation by its id, signed by the driver app, by the contract', async () => {
    const detail = { kind: 'commission', amount: -18_000, balances: ['bonus'], createdAt: 1, booking: {} };
    const fetch = vi.fn<Fetch>(async () => Response.json(detail));
    await expect(createWalletClient({ ...options, fetch }).detail('op-1')).rejects.toThrow();
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.test/driver/wallet/op-1');
    expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get('x-mini-app')).toBe('driver');
  });

  it('fails with the code of the server for an operation that is not the driver’s', async () => {
    const missing = vi.fn<Fetch>(async () => Response.json({ error: 'wallet.not_found' }, { status: 404 }));
    await expect(createWalletClient({ ...options, fetch: missing }).detail('op-9')).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
