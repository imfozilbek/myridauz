import type { MarketClient } from '@platform/api-client';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findRoute, findTo, searchMarket } from '../find/search-test-kit';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { pullDown, rows, scrolledTo as at, skeleton as busy } from './list-test-kit';
import { renderMarket, tap, trip } from './market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
const DRIVER = /^Jasur ★/u;

const searches = (tracked: readonly { readonly name: string }[]) =>
  tracked.filter((event) => event.name === 'trip_search').length;

describe('Search results after «Назад» from a trip (docs/94 F2)', { timeout: 20_000 }, () => {
  it('come back at once at the same place, counted once; back to the day they start fresh', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => [trip]);
    const scrollTo = vi.spyOn(window, 'scrollTo');
    const { tracked } = renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket(), searchTrips } }),
    );
    await findRoute();
    await screen.findByText(DRIVER);
    at(700);
    await tap(DRIVER);
    await tap('Orqaga');
    // The same trips without a skeleton, the same place, no second search event.
    expect(busy()).toBeNull();
    expect(screen.getByText(DRIVER)).toBeTruthy();
    expect(scrollTo).toHaveBeenLastCalledWith(0, 700);
    expect(searches(tracked)).toBe(1);
    // A quiet refresh in the background.
    await waitFor(() => expect(searchTrips).toHaveBeenCalledTimes(2));
    await tap('Orqaga');
    scrollTo.mockClear();
    await findTo();
    expect(busy()).not.toBeNull();
    await screen.findByText(DRIVER);
    expect(scrollTo).not.toHaveBeenCalledWith(0, 700);
    expect(searches(tracked)).toBe(2);
  });

  it('W1, S3: a pull down refreshes quietly; every trip is a row kept under the finger', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => [trip]);
    const { tracked } = renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket(), searchTrips } }),
    );
    await findRoute();
    await screen.findByText(DRIVER);
    expect(rows()).toEqual(['t1']);
    await pullDown();
    expect(searchTrips).toHaveBeenCalledTimes(2);
    expect(busy()).toBeNull();
    expect(searches(tracked)).toBe(1);
  });
});
