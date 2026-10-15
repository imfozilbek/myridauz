import type { LimitsClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOwnerLimits } from './owner-limits';

const brand = loadBrand();
afterEach(cleanup);
const client = (current: LimitsClient['current']): LimitsClient => ({
  current,
  state: vi.fn(),
  change: vi.fn(),
});

// «Cheklovlar» (G75, docs/128 §4): the screens show what the server checks.
describe('the limits of the owner in a Mini App', () => {
  it('puts the values of the owner over the brand, a value out of its rule never', async () => {
    const values = { 'wallet.fewSeats': 8, 'requests.maxSeats': 40 };
    const { result } = renderHook(() =>
      useOwnerLimits(
        brand,
        client(async () => ({ values })),
      ),
    );
    await waitFor(() => expect(result.current.limited.wallet.fewSeats).toBe(8));
    expect(result.current.limited.requests.maxSeats).toBe(brand.requests.maxSeats);
    // An answer without the word on calls keeps the buttons (G52).
    expect(result.current.calls).toBe(true);
  });

  it('hides the call buttons when the server has no calls set up (G52)', async () => {
    const { result } = renderHook(() =>
      useOwnerLimits(
        brand,
        client(async () => ({ values: {}, calls: false })),
      ),
    );
    await waitFor(() => expect(result.current.calls).toBe(false));
  });

  it('keeps the brand defaults when the values do not come', async () => {
    const down = vi.fn(async () => Promise.reject(new Error('net')));
    const { result } = renderHook(() => useOwnerLimits(brand, client(down)));
    await waitFor(() => expect(down).toHaveBeenCalled());
    expect(result.current).toEqual({ limited: brand, calls: true });
  });
});
