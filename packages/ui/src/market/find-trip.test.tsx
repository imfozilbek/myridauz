import type { BookingsClient, MarketClient } from '@platform/api-client';
import { DAY_MS, tashkentDate } from '@platform/contracts';
import { booking } from '../bookings/booking-test-kit';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { MapEngineContext } from '../map/map-engine';
import { CHORSU, fakeMap, testMap } from '../map/map-test-kit';
import { quickRoute, renderMarket, tap, trip } from './market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

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
    // K1, K2: «Qayerga» at once, then the trips of the nearest day, no «Davom etish», no day screen.
    await quickRoute();
    expect(await screen.findByText('Jasur')).toBeTruthy();
    expect(screen.queryByText('Davom etish')).toBeNull();
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
      'to',
      'from',
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
        market: { searchTrips: async () => [trip], myRequests: async () => [] },
        bookings: { book, myBookings: async () => [booking], myOffers: async () => [] },
        map: testMap({ search }),
      }),
    );
    await quickRoute();
    await tap('Jasur');
    // The way of the driver (docs/70): both, so the passenger chooses it at the booking.
    expect(await screen.findByText('Uyingizdan yoki Qoʻyliq pitagidan')).toBeTruthy();
    await tap('Joy band qilish');
    // K3: no step of the seats, the way comes first.
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
    expect(await screen.findByText('Qayerda tushasiz?')).toBeTruthy();
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda');
    expect(await screen.findByText('Joy soʻrash')).toBeTruthy();
    // K3: 1 person at first, «+» in the check makes 2.
    expect(screen.getByText('1 kishi')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Oshirish' }));
    expect(screen.getByText('2 kishi')).toBeTruthy();
    expect(screen.getByText(/190\s000/)).toBeTruthy();
    // How the passenger pays, under «Jami» (docs/89 P2).
    expect(screen.getByText(/Pulni haydovchiga safarda/u)).toBeTruthy();
    await tap('Soʻrov yuborish');
    expect(await screen.findByText('Soʻrov yuborildi')).toBeTruthy();
    // PS15: what was asked and until when the driver answers.
    expect(screen.getByText('Siz soʻragan joy')).toBeTruthy();
    expect(screen.getByText('Javob berish muddati')).toBeTruthy();
    // The main button opens the sent request, as the text calls (docs/89 P9).
    await tap('Soʻrovni koʻrish');
    // The booking opens at once, the list under it is never seen for a frame (G41, docs/108 F).
    expect(await screen.findByText('Joy soʻraldi')).toBeTruthy();
    expect(screen.queryByText('Mening safarlarim')).toBeNull();
    expect(book).toHaveBeenCalledWith('t1', {
      seats: 2,
      mode: 'door',
      pickup: expect.objectContaining({ lat: expect.any(Number) }),
      dropoff: expect.objectContaining({ lat: expect.any(Number) }),
    });
    expect(tracked.filter((event) => event.name === 'booking_step').map((event) => event.step)).toEqual([
      'mode',
      'pickup',
      'dropoff',
      'requested',
    ]);
  });

  it('says so when nothing is found, and a calendar day can be chosen', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(<FindTripFlow onBack={() => undefined} />, testClients({ market: { searchTrips } }));
    await quickRoute();
    expect(await screen.findByText('Bu kunga safar topilmadi')).toBeTruthy();
    // K2: «Boshqa kun» opens the calendar at once.
    await tap('Boshqa kun');
    const day = screen.getByLabelText('Qaysi kuni?') as HTMLInputElement;
    // The field is never empty (an empty date field on an iPhone is a blank bar): the day after
    // tomorrow, the first one the chips do not have, and «Davom etish» at once.
    expect(day.value).toBe(tashkentDate(Date.now() + 2 * DAY_MS));
    expect(screen.getByText('Davom etish')).toBeTruthy();
    fireEvent.change(day, { target: { value: day.max } });
    await tap('Davom etish');
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0].date).toBe(day.max));
    expect(await screen.findByText('Bu kunga safar topilmadi')).toBeTruthy();
  });
});
