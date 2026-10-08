import type { MapClient, MarketClient } from '@platform/api-client';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { chooseRoute, recommendation, renderMarket, ROUTE, tap, trip } from './market-test-kit';
import { NewTripFlow } from './new-trip-flow';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const AGAIN = { pickupMode: 'both', seats: 2, price: 90_000, comment: '' } as const;
const PITAK = { id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.2438, lng: 69.3394 } };
// A pitak belongs to one direction: Toshkent shahri → Fargʻona has one, the way back has none.
const oneWay: MapClient['pitakOf'] = async (from) => (from === '1726' ? PITAK : null);

function open(pitakOf: MapClient['pitakOf'], again?: typeof AGAIN) {
  const publishTrip = vi.fn<MarketClient['publishTrip']>(async () => trip);
  renderMarket(
    <NewTripFlow {...(again ? { route: ROUTE, again } : {})} onBack={() => undefined} />,
    testClients({
      market: { recommend: async () => recommendation, publishTrip },
      map: testMap({ pitakOf: vi.fn(pitakOf) }),
    }),
  );
  return publishTrip;
}

async function publishDay() {
  await tap(/^Ertaga/);
  await tap('Davom etish');
  await tap('Eʼlon qilish');
  expect(await screen.findByText('Safar eʼlon qilindi')).toBeTruthy();
}

// A trip that repeats another one takes its way of pickup only where the new direction has a pitak;
// elsewhere «around the city», with no extra question (G63: the server refuses a pitak that is not).
describe('the way of pickup of a repeated trip (G63)', { timeout: 20_000 }, () => {
  it('«Oxirgi yoʻnalish» on a direction without a pitak goes around the city', async () => {
    const publishTrip = open(async () => null, AGAIN);
    await publishDay();
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ pickupMode: 'door' }));
  });

  it('«Oxirgi yoʻnalish» with the pitak keeps the way and asks only the day', async () => {
    const publishTrip = open(async () => PITAK, AGAIN);
    await publishDay();
    expect(screen.queryByText('Ikkalasi ham')).toBeNull();
    expect(publishTrip).toHaveBeenCalledWith(expect.objectContaining({ pickupMode: 'both' }));
  });

  it('«Qaytish safari» of a trip with the pitak goes back around the city', async () => {
    const publishTrip = open(oneWay);
    await chooseRoute();
    await tap('Ikkalasi ham');
    await tap(/^Ertaga/);
    for (const step of ['Davom etish', 'Davom etish', 'Davom etish', 'Davom etish']) await tap(step);
    await tap('Izohsiz davom etish');
    await tap('Eʼlon qilish');
    await tap('Qaytish safari');
    await publishDay();
    expect(publishTrip.mock.calls.map(([input]) => [input.from, input.pickupMode])).toEqual([
      [ROUTE.from.id, 'both'],
      [ROUTE.to.id, 'door'],
    ]);
  });
});
