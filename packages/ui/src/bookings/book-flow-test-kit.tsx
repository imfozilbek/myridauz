import type { BookingsClient } from '@platform/api-client';
import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { FeedContext } from '../feed/feed-context';
import { testFeed } from '../feed/test-feed';
import { MapEngineContext } from '../map/map-engine';
import { fakeMap, testMap } from '../map/map-test-kit';
import { renderMarket, trip } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { booking } from './booking-test-kit';
import { BookFlow } from './book-flow';

// Test helper of «Qayerdan, qayerga?» (G59): two seats of the trip, the map of Fargʻona.
export const FARGONA_WHERE = {
  district: '1730401',
  name: { step: 'mahalla', name: 'Yangi Margʻilon' },
  area: null,
} as const;
const TWO = { seats: 2, wholeCar: false, withWoman: false };

export const openBook = (
  pickupMode: typeof trip.pickupMode,
  calls: Parameters<typeof testMap>[0] = {},
  book = vi.fn<BookingsClient['book']>(async () => booking),
  bookings: Partial<BookingsClient> = {},
) => {
  const map = fakeMap();
  const onHome = vi.fn();
  const onClose = vi.fn();
  const feed = testFeed();
  renderMarket(
    <FeedContext.Provider value={feed.subscribe}>
      <MapEngineContext.Provider value={async () => map.engine}>
        <PlacesGate>
          <BookFlow
            trip={{ ...trip, pickupMode }}
            choice={TWO}
            onBack={() => undefined}
            onClose={onClose}
            onHome={onHome}
          />
        </PlacesGate>
      </MapEngineContext.Provider>
    </FeedContext.Provider>,
    testClients({ bookings: { book, ...bookings }, map: testMap(calls) }),
  );
  return { book, map, onHome, onClose, fire: feed.fire };
};
export const row = (label: string) => screen.getByText(label).closest('button') as HTMLElement;
