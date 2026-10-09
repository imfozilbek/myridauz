import type { LimitsClient } from '@platform/api-client';
import { loadBrand } from '@platform/brands';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOwnerLimits } from './owner-limits';

const brand = loadBrand();
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
    await waitFor(() => expect(result.current.wallet.fewSeats).toBe(8));
    expect(result.current.requests.maxSeats).toBe(brand.requests.maxSeats);
  });

  it('keeps the brand defaults when the values do not come', async () => {
    const down = vi.fn(async () => Promise.reject(new Error('net')));
    const { result } = renderHook(() => useOwnerLimits(brand, client(down)));
    await waitFor(() => expect(down).toHaveBeenCalled());
    expect(result.current).toBe(brand);
  });
});
