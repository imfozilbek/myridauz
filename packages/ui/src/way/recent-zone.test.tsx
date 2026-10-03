import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FindTripFlow } from '../market/find-trip-flow';
import { quickRoute, renderMarket, tap, trip } from '../market/market-test-kit';
import { MapEngineContext } from '../map/map-engine';
import { fakeMap, testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const CHILONZOR = '1726269';
const FARGONA = '1730401';
const recent = (name: string, district: string) => ({
  point: { lat: 41, lng: 69 },
  name: { step: 'landmark', name },
  district,
});

describe('«Oxirgi joylar» of a booking (docs/90 F-P5)', { timeout: 20_000 }, () => {
  it('offers only the places inside the zone of the point', async () => {
    localStorage.setItem(
      'way_recent',
      JSON.stringify([recent('Uzoq joy', FARGONA), recent('Yaqin joy', CHILONZOR)]),
    );
    const map = fakeMap();
    renderMarket(
      <MapEngineContext.Provider value={async () => map.engine}>
        <FindTripFlow onBack={() => undefined} />
      </MapEngineContext.Provider>,
      testClients({ market: { searchTrips: async () => [trip] }, map: testMap() }),
    );
    await quickRoute();
    await tap('Jasur');
    await tap('Joy band qilish');
    await tap('Uyimdan');
    expect(await screen.findByText('Oxirgi joylar')).toBeTruthy();
    expect(screen.getByText(/Yaqin joy/u)).toBeTruthy();
    expect(screen.queryByText(/Uzoq joy/u)).toBeNull();
  });
});
