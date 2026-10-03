import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tap } from '../market/market-test-kit';
import { fakeMap, openPoint } from '../map/map-test-kit';

vi.mock('../telegram/location', () => ({ requestPosition: vi.fn(async () => null) }));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('«Shu yerda» before the name of the place came (slow internet)', { timeout: 20_000 }, () => {
  it('waits and never says the point is outside', async () => {
    const { done } = openPoint(fakeMap(), { where: vi.fn(() => new Promise<never>(() => undefined)) });
    await screen.findByText('Joy aniqlanmoqda…', {}, { timeout: 5000 });
    await tap('Shu yerda');
    expect(screen.queryByText(/hududida emas/u)).toBeNull();
    expect(done).toEqual([]);
  });
});
