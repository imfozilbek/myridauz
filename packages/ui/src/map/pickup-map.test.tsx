import { ApiError, type BookingsClient } from '@platform/api-client';
import type { Point } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { MapEngineContext, type MapEngine } from './map-engine';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const TASHKENT = { lat: 41.3111, lng: 69.2797 };
const ALMATY = { lat: 43.2389, lng: 76.8897 };

// jsdom draws no map: a fake one keeps the point under the pin.
function fakeMap(failures = 0) {
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

function open(map: ReturnType<typeof fakeMap>, setPickup: BookingsClient['setPickup']) {
  const myBookings = vi.fn(async () => [confirmed]);
  renderMarket(
    <MapEngineContext.Provider value={async () => map.engine}>
      <MyRequestsScreen onBack={() => undefined} />
    </MapEngineContext.Provider>,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings, myOffers: async () => [], setPickup },
    }),
  );
  return myBookings;
}

describe('the pickup point on the map (G22, docs/14)', () => {
  it('saves the point under the pin and comes back to the fresh booking', async () => {
    const map = fakeMap();
    const setPickup = vi.fn<BookingsClient['setPickup']>(async () => ({ ...confirmed, pickup: TASHKENT }));
    const myBookings = open(map, setPickup);
    await tap('Jasur');
    await tap('Xaritada tanlash');
    // The map opens at the meeting point the driver chose.
    expect(await screen.findByText('Uchrashuv joyingiz')).toBeTruthy();
    expect(map.engine.mock.calls[0]?.[2]).toEqual(confirmed.meetingPoint);
    expect(screen.getByText('© OpenStreetMap')).toBeTruthy();
    map.place(TASHKENT);
    await tap('Shu yerda');
    expect(setPickup).toHaveBeenCalledWith(confirmed.id, TASHKENT);
    expect(await screen.findByText('Davlat raqami')).toBeTruthy();
    expect(myBookings).toHaveBeenCalledTimes(2);
  });

  it('keeps a point outside Uzbekistan and a refused save on the map with the reason', async () => {
    const map = fakeMap();
    const setPickup = vi.fn<BookingsClient['setPickup']>(async () => {
      throw new ApiError(409, 'bookings.wrong_status');
    });
    open(map, setPickup);
    await tap('Jasur');
    await tap('Xaritada tanlash');
    await screen.findByText('Uchrashuv joyingiz');
    map.place(ALMATY);
    await tap('Shu yerda');
    expect(await screen.findByText(/Oʻzbekistonda emas/)).toBeTruthy();
    expect(setPickup).not.toHaveBeenCalled();
    map.place(TASHKENT);
    await tap('Shu yerda');
    expect(await screen.findByText('Bu soʻrov allaqachon oʻzgargan. Roʻyxatni yangilang.')).toBeTruthy();
  });

  it('moves to where the person stands, or says it could not find them', async () => {
    const map = fakeMap();
    const here = { lat: 41.2995, lng: 69.2401 };
    let allowed = true;
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: (ok: PositionCallback, no: () => void) =>
          allowed ? ok({ coords: { latitude: here.lat, longitude: here.lng } } as GeolocationPosition) : no(),
      },
    });
    open(map, vi.fn());
    await tap('Jasur');
    await tap('Xaritada tanlash');
    await tap('Mening joylashuvim');
    await vi.waitFor(() => expect(map.at()).toEqual(here));
    allowed = false;
    await tap('Mening joylashuvim');
    expect(await screen.findByText(/Joylashuvingizni aniqlab boʻlmadi/)).toBeTruthy();
  });

  it('says the map did not load, offers the bot, and tries again', async () => {
    const map = fakeMap(1);
    open(map, vi.fn());
    await tap('Jasur');
    await tap('Xaritada tanlash');
    expect(await screen.findByText('Xarita yuklanmadi')).toBeTruthy();
    expect(screen.getByText(/botdagi tasdiq xabariga/)).toBeTruthy();
    await tap('Qayta urinish');
    expect(await screen.findByText('Uchrashuv joyingiz')).toBeTruthy();
    expect(map.engine).toHaveBeenCalledTimes(2);
  });
});
