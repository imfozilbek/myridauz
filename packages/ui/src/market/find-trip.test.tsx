import type { BookingsClient, MarketClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { findRoute, searchMarket } from '../find/search-test-kit';
import { MapEngineContext } from '../map/map-engine';
import { fakeMap, testMap } from '../map/map-test-kit';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { renderMarket, tap, trip } from './market-test-kit';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('FindTripFlow: a passenger looks for a trip (G59, docs/118 path 2)', { timeout: 20_000 }, () => {
  it('opens the trips of a direction card: the days with their trips, the filters, then «Safar»', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => [trip]);
    const { tracked } = renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket([0, 3]), searchTrips } }),
    );
    await tap('Toshkent shahri');
    await tap('Chilonzor');
    // «Qayerdan» in one line, the card of the region with its trips and «… soʻmdan».
    expect(await screen.findByText('Qayerga borasiz?')).toBeTruthy();
    expect(screen.getByText(/^Chilonzor/u)).toBeTruthy();
    expect(screen.getByText('Bugun 2 ta, ertaga 5 ta safar')).toBeTruthy();
    await tap('Fargʻona');
    // Today has no trips: the list opens on tomorrow, every day says how many it has.
    expect(await screen.findByText(/^Jasur ★/u)).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Ertaga\s*3 ta/u, selected: true })).toBeTruthy();
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726269', to: '1730' });
    // A whole region: its district is chosen by a link under the list.
    expect(screen.getByText('Fargʻonaning qaysi joyi? Tuman tanlash')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Mashinada ayol bor/u }));
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0]).toMatchObject({ woman: '1' }));
    await tap(/^Jasur ★/u);
    expect(await screen.findByText('Necha kishi ketadi?')).toBeTruthy();
    expect(tracked.find((event) => event.name === 'trip_open')).toBeTruthy();
  });

  it('finds a district by «Boshqa joy» without its region first', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket([0, 0]), searchTrips } }),
    );
    await findRoute();
    await waitFor(() => expect(searchTrips).toHaveBeenCalled());
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726269', to: '1730401' });
    // No trips: the three ways to know about a new one.
    expect(await screen.findByText('Hozircha safar yoʻq')).toBeTruthy();
    expect(screen.getByText('Xabar bering')).toBeTruthy();
    expect(screen.getByText('Soʻrov qoldirish')).toBeTruthy();
  });

  it('books 2 seats: «Jami» counts them, then the points and at once the waiting booking', async () => {
    const book = vi.fn<BookingsClient['book']>(async () => booking);
    const map = fakeMap();
    renderMarket(
      <MapEngineContext.Provider value={async () => map.engine}>
        <FindTripFlow onBack={() => undefined} />
      </MapEngineContext.Provider>,
      testClients({
        market: { ...searchMarket(), searchTrips: async () => [trip], myRequests: async () => [] },
        bookings: { book, myBookings: async () => [], myOffers: async () => [] },
        map: testMap(),
      }),
    );
    await findRoute();
    await tap(/^Jasur ★/u);
    // The driver on top: the plate is seen before the booking (owner decision, G59).
    expect(await screen.findByText('01 A 123 BC')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Oshirish' }));
    expect(screen.getByText(/190\s000/u)).toBeTruthy();
    await tap('2 ta joy band qilish');
    expect(await screen.findByText('Qayerdan, qayerga?')).toBeTruthy();
    fireEvent.click(screen.getByText('Tushirish joyi'));
    await screen.findByText('Yangi Margʻilon', {}, { timeout: 3000 });
    await tap('Shu yerda tushaman');
    await tap('Soʻrov yuborish');
    expect(await screen.findByText('Javob kutilmoqda')).toBeTruthy();
    expect(book).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ seats: 2, mode: 'pitak', wholeCar: false }),
    );
  });
});
