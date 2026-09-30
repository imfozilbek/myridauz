import type { BookingsClient, MapClient } from '@platform/api-client';
import type { Point } from '@platform/contracts';
import { vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { MapEngineContext, type MapEngine } from './map-engine';

export const TASHKENT = { lat: 41.3111, lng: 69.2797 };

// jsdom draws no map: a fake one keeps the point under the pin.
export function fakeMap(failures = 0) {
  let center: Point = TASHKENT;
  let left = failures;
  const engine = vi.fn<MapEngine>(async (_box, _source, start) => {
    if (left-- > 0) throw new Error('map.failed');
    center = start;
    return {
      center: () => center,
      onMove: () => undefined,
      moveTo: (point) => void (center = point),
      remove: () => undefined,
    };
  });
  return { engine, place: (point: Point) => void (center = point), at: () => center };
}

type Calls = {
  readonly setPickup?: BookingsClient['setPickup'];
  readonly search?: MapClient['search'];
};

// The passenger opens the confirmed booking and its map (G22).
export async function openMap(map: ReturnType<typeof fakeMap>, { setPickup, search }: Calls = {}) {
  const myBookings = vi.fn(async () => [confirmed]);
  renderMarket(
    <MapEngineContext.Provider value={async () => map.engine}>
      <MyRequestsScreen onBack={() => undefined} />
    </MapEngineContext.Provider>,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings, myOffers: async () => [], ...(setPickup ? { setPickup } : {}) },
      ...(search ? { map: { search } } : {}),
    }),
  );
  await tap('Jasur');
  await tap('Xaritada tanlash');
  return myBookings;
}
