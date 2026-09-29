import { ApiError } from '@platform/api-client';
import type { Direction, PricingState, PricingVariables } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { locations, tap } from '../market/market-test-kit';
import { renderInShell, testClients } from '../test-shell';
import { ManagementScreen } from './management-screen';

afterEach(cleanup);

const V: PricingVariables = { ratePerKm: 300, roundStep: 5000, minPrice: 30000, maxPrice: 600000 };
const state: PricingState = {
  current: { version: 2, variables: V, changedBy: 900, changedAt: 1 },
  history: [
    { version: 2, variables: V, changedBy: 900, changedAt: 1 },
    { version: 1, variables: V, changedBy: null, changedAt: 0 },
  ],
};
const direction: Direction = { from: '1726269', to: '1730401', km: 320, formula: 95000, manual: null };

function setup() {
  const pricing = {
    state: vi.fn(async () => state),
    directions: vi.fn(async () => [direction]),
    preview: vi.fn(async () => ({
      rows: [{ from: '1726269', to: '1730401', km: 320, before: 95000, after: 130000 }],
    })),
    save: vi.fn(async () => state),
    rollback: vi.fn(async () => state),
    setDirection: vi.fn(async () => [direction]),
  };
  renderInShell(
    <ManagementScreen onBack={() => undefined} />,
    false,
    true,
    locations,
    testClients({ pricing }),
  );
  return pricing;
}

describe('Narxlar: the price engine for the team (docs/23)', () => {
  it('changes the formula after "было → стало"', async () => {
    const pricing = setup();
    await tap('Narxlar');
    await tap('Formulani oʻzgartirish');
    fireEvent.change(screen.getByDisplayValue('300'), { target: { value: '400' } });
    await tap('Oʻzgarishni koʻrish');
    expect(await screen.findByText(/→ 130/)).toBeTruthy();
    await tap('Saqlash');
    expect(pricing.save).toHaveBeenCalledWith({ ...V, ratePerKm: 400 });
  });

  it('sets a price for a direction, refuses one out of the bounds and rolls back a version', async () => {
    const pricing = setup();
    pricing.setDirection.mockRejectedValueOnce(new ApiError(422, 'pricing.out_of_bounds'));
    await tap('Narxlar');
    await tap('Chilonzor → Fargʻona shahri');
    fireEvent.change(screen.getByDisplayValue('95000'), { target: { value: '700000' } });
    await tap('Narxni saqlash');
    expect(await screen.findByText('Narx ruxsat etilgan chegarada boʻlsin.')).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue('700000'), { target: { value: '100000' } });
    await tap('Narxni saqlash');
    expect(pricing.setDirection).toHaveBeenLastCalledWith({ from: '1726269', to: '1730401', price: 100000 });
    await tap('Shu versiyaga qaytish');
    expect(pricing.rollback).toHaveBeenCalledWith(1);
  });
});
