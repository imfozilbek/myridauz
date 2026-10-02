import type { BookingsClient, MarketClient } from '@platform/api-client';
import { booking } from '../bookings/booking-test-kit';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { MapEngineContext } from '../map/map-engine';
import { CHORSU, fakeMap, testMap } from '../map/map-test-kit';
import { chooseRoute, renderMarket, tap, trip } from './market-test-kit';

afterEach(cleanup);

describe('FindTripFlow: a passenger looks for a trip (docs/06, docs/14)', { timeout: 20_000 }, () => {
  it('searches the route by lists on a day, filters "ayol bor" and opens a trip', async () => {
    const atPitak = {
      ...trip,
      id: 't2',
      pickupMode: 'pitak' as const,
      driver: { ...trip.driver, firstName: 'Bobur' },
    };
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => [trip, atPitak]);
    const { tracked } = renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips } }),
    );
    await chooseRoute();
    await tap(/^Bugun/);
    expect(await screen.findByText('Jasur')).toBeTruthy();
    // Every stop shows two levels: the place and its region, and the arrival is approximate.
    expect(screen.getAllByText('Toshkent shahri').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^≈ \d\d:\d\d$/).length).toBeGreaterThan(0);
    // No way and no points in the search: all the trips of the route (G26, docs/74).
    expect(searchTrips.mock.calls[0]?.[0]).toEqual({
      from: '1726269',
      to: '1730401',
      date: expect.any(String),
    });
    // «Uyimdan olib ketsin» keeps only the trips that pick up at the door (docs/88 L5).
    expect(screen.getByText('Bobur')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Uyimdan olib ketsin' }));
    expect(screen.queryByText('Bobur')).toBeNull();
    expect(screen.getByText('Jasur')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mashinada ayol bor' }));
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0]).toMatchObject({ woman: '1' }));
    expect(tracked.filter((event) => event.name === 'way_step').map((event) => event.step)).toEqual([
      'opened',
      'from',
      'to',
      'done',
    ]);
    expect(tracked.find((event) => event.name === 'trip_search')).toMatchObject({ result: 'found' });
  });

  it('books with the point at the door inside Toshkent and the point at home inside the end', async () => {
    const book = vi.fn<BookingsClient['book']>(async () => booking);
    const map = fakeMap();
    const search = vi.fn<NonNullable<ReturnType<typeof testMap>['search']>>(async () => [CHORSU]);
    const { tracked } = renderMarket(
      <MapEngineContext.Provider value={async () => map.engine}>
        <FindTripFlow onBack={() => undefined} />
      </MapEngineContext.Provider>,
      testClients({
        market: { searchTrips: async () => [trip] },
        bookings: { book },
        map: testMap({ search }),
      }),
    );
    await chooseRoute();
    await tap(/^Bugun/);
    await tap('Jasur');
    // The way of the driver (docs/70): both, so the passenger chooses it at the booking.
    expect(await screen.findByText('Uyingizdan yoki Qoʻyliq pitagidan')).toBeTruthy();
    await tap('Joy band qilish');
    await tap('2 kishi');
    await tap('Uyimdan');
    expect(await screen.findByText('Qayerdan olib ketsin?')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Mahalla, koʻcha yoki moʻljal'), {
      target: { value: 'Chorsu' },
    });
    await waitFor(() => expect(search).toHaveBeenCalledWith('Chorsu', { lat: 41, lng: 69 }, '1726'));
    await tap('Chorsu bozori');
    await screen.findByText('Chorsu bozori yaqinida', {}, { timeout: 3000 });
    await tap('Shu yerda');
    // The map of the end opens in Fargʻona shahri: the name under the pin is there.
    expect(await screen.findByText('Uyingiz qayerda?')).toBeTruthy();
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda');
    expect(await screen.findByText('Joy soʻrash')).toBeTruthy();
    expect(screen.getByText(/190\s000/)).toBeTruthy();
    // How the passenger pays, under «Jami» (docs/89 P2).
    expect(screen.getByText(/Pulni haydovchiga safarda/u)).toBeTruthy();
    await tap('Soʻrov yuborish');
    expect(await screen.findByText('Soʻrov yuborildi')).toBeTruthy();
    expect(book).toHaveBeenCalledWith('t1', {
      seats: 2,
      mode: 'door',
      pickup: expect.objectContaining({ lat: expect.any(Number) }),
      dropoff: expect.objectContaining({ lat: expect.any(Number) }),
    });
    expect(tracked.filter((event) => event.name === 'booking_step').map((event) => event.step)).toEqual([
      'seats',
      'mode',
      'pickup',
      'dropoff',
      'requested',
    ]);
  });

  it('says so when nothing is found, and a calendar day can be chosen', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(<FindTripFlow onBack={() => undefined} />, testClients({ market: { searchTrips } }));
    await chooseRoute();
    await tap('Boshqa kun');
    const day = screen.getByLabelText('Qaysi kuni?') as HTMLInputElement;
    fireEvent.change(day, { target: { value: day.min } });
    await tap('Davom etish');
    expect(await screen.findByText('Bu kunga safar topilmadi')).toBeTruthy();
  });
});
