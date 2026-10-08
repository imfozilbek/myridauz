import type { BookingsClient } from '@platform/api-client';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapEngineContext } from '../map/map-engine';
import { fakeMap, testMap } from '../map/map-test-kit';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { booking } from './booking-test-kit';
import { BookFlow } from './book-flow';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const ONE = { seats: 1, wholeCar: false, withWoman: false };

// «Izoh (ixtiyoriy)» of the passenger (owner decision 08.10.2026): how the driver knows the passenger
// at the meeting (mockup g63/4 screen 13), the same row as on the publishing of the driver.
describe('the note of a booking on «Qayerdan, qayerga?»', { timeout: 20_000 }, () => {
  it('may stay empty, and goes with the request once written', async () => {
    const book = vi.fn<BookingsClient['book']>(async () => booking);
    const map = fakeMap();
    renderMarket(
      <MapEngineContext.Provider value={async () => map.engine}>
        <PlacesGate>
          <BookFlow
            trip={{ ...trip, pickupMode: 'pitak' }}
            choice={ONE}
            onBack={() => undefined}
            onClose={() => undefined}
            onHome={() => undefined}
          />
        </PlacesGate>
      </MapEngineContext.Provider>,
      testClients({ bookings: { book }, map: testMap() }),
    );
    await tap('Izoh (ixtiyoriy)');
    fireEvent.change(await screen.findByPlaceholderText('Izoh yozing'), {
      target: { value: 'Qizil kurtka, sumka bilan' },
    });
    await tap('Davom etish');
    expect(await screen.findByText('Qizil kurtka, sumka bilan')).toBeTruthy();
    fireEvent.click(screen.getByText('Tushirish joyi').closest('button') as HTMLElement);
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda tushaman');
    await tap('Soʻrov yuborish');
    await vi.waitFor(() => expect(book).toHaveBeenCalled());
    expect(book.mock.calls[0]?.[1]).toMatchObject({ note: 'Qizil kurtka, sumka bilan' });
  });
});
