import type { BookingsClient, MarketClient } from '@platform/api-client';
import type { RequestBoard, RideRequest } from '@platform/contracts';
import { vi } from 'vitest';
import { request } from '../bookings/booking-test-kit';
import { DriverContext } from '../driver/driver-context';
import { approved } from '../home/home-test-kit';
import { recommendation, renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { RequestsFlow } from './requests-flow';

// 06:00 in Tashkent (UTC+5) on the day of the requests: the free times start at 08:00 (docs/103).
export const NOW = Date.parse('2026-10-02T01:00:00Z');
// 08:00 and 10:00 in Tashkent on that day.
export const EIGHT = Date.parse('2026-10-02T03:00:00Z');
export const TEN = Date.parse('2026-10-02T05:00:00Z');

export const asked: RideRequest = {
  ...request,
  passenger: { ...request.passenger, rating: { average: 4.8, count: 12 } },
};
export const salon: RideRequest = { ...asked, id: 'r2', wholeCar: true, pickupMode: 'pitak' };

export const board = (over: Partial<RequestBoard> = {}): RequestBoard => ({
  known: true,
  date: '2026-10-02',
  days: [
    { date: '2026-10-02', count: 1 },
    { date: '2026-10-03', count: 5 },
    { date: '2026-10-08', count: 1 },
  ],
  trip: null,
  fits: [],
  others: [asked],
  carSeats: 4,
  ...over,
});

type Fakes = {
  readonly requestBoard?: MarketClient['requestBoard'];
  readonly bookings?: Partial<BookingsClient>;
  readonly market?: Partial<MarketClient>;
};

// The board of an approved driver with a car of 4 seats; every call is a spy the test reads.
export function openBoard(fakes: Fakes = {}) {
  const requestBoard = vi.fn(fakes.requestBoard ?? (async () => board()));
  renderMarket(
    <DriverContext.Provider value={approved}>
      <RequestsFlow onBack={() => undefined} />
    </DriverContext.Provider>,
    testClients({
      market: { requestBoard, recommend: async () => recommendation, ...fakes.market },
      bookings: { ...fakes.bookings },
      map: {
        pitakOf: async () => ({ id: 'qoyliq', name: 'Qoʻyliq pitagi', point: { lat: 41.24, lng: 69.34 } }),
      },
    }),
  );
  return requestBoard;
}
