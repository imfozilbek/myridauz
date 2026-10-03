import type { MarketClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { quickRoute, recommendation, renderMarket, tap, trip } from './market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('FindTripFlow: the day and the empty day (G35, docs/97 K2, K6)', { timeout: 20_000 }, () => {
  it('opens the nearest day with trips: tomorrow when today has none (K2)', async () => {
    const days: string[] = [];
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async ({ date }) => {
      days.push(date);
      return date === days[1] ? [trip] : [];
    });
    renderMarket(<FindTripFlow onBack={() => undefined} />, testClients({ market: { searchTrips } }));
    await quickRoute();
    // Only tomorrow has the trip: the list shows it without a tap on a day.
    expect(await screen.findByText('Jasur')).toBeTruthy();
  });

  it('moves to tomorrow by «Ertaga» after the first day was found (G35 K2)', async () => {
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips: async () => [] } }),
    );
    await quickRoute();
    // The route is the title, the day is on its chip (G40, docs/106 C6).
    expect(await screen.findByText('Chilonzor → Fargʻona shahri')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Bugun', selected: true })).toBeTruthy();
    await tap('Ertaga');
    expect(await screen.findByRole('tab', { name: 'Ertaga', selected: true })).toBeTruthy();
  });

  it('leaves a request from an empty day with its route and day (K6)', async () => {
    const publishRequest = vi.fn<MarketClient['publishRequest']>(async () => {
      throw new Error('test.stop');
    });
    const recommend = async () => recommendation;
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips: async () => [], publishRequest, recommend }, map: testMap() }),
    );
    await quickRoute();
    // One main action on an empty day: the request, no second button beside it (G37, docs/101 R9).
    expect(await screen.findByText('Bu kunga safar topilmadi')).toBeTruthy();
    expect(screen.queryByText('Xabar bering')).toBeNull();
    await tap('Soʻrov qoldirish');
    // The route and the day come from the search: the way of the pickup is the next question.
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    expect(screen.queryByText('Qaysi kuni?')).toBeNull();
  });
});
