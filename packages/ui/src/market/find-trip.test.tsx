import { toCyrillic } from '@platform/i18n';
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
    // Toshkent shahri says «Butun shahar» and is taken whole in one tap (G78 П9).
    expect(await screen.findByText(toCyrillic('Butun shahar'))).toBeTruthy();
    await tap(toCyrillic('Toshkent shahri'));
    // «Qayerdan» in one line, the tile of the region with its trips (no price: owner, 12.11.2026).
    expect(await screen.findByText(toCyrillic('Qayerga borasiz?'))).toBeTruthy();
    expect(screen.getByText(/^Тошкентдан/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Bugun 2 ta, ertaga 5 ta safar'))).toBeTruthy();
    await tap(toCyrillic('Fargʻona'));
    // Today has no trips: the list opens on tomorrow; a day with trips has its dot (docs/172).
    expect(await screen.findByText(/^Jasur ★/u)).toBeTruthy();
    expect(document.querySelectorAll('.week-day')[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelectorAll('.week-day')[1]?.querySelector('.week-dot-none')).toBeNull();
    expect(document.querySelectorAll('.week-day')[0]?.querySelector('.week-dot-none')).not.toBeNull();
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726', to: '1730' });
    // A whole region: its district is chosen by a link under the list.
    expect(screen.getByText(toCyrillic('Fargʻonaning qaysi joyi? Tuman tanlash'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Машинада аёл бор/u }));
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0]).toMatchObject({ woman: '1' }));
    await tap(/^Jasur ★/u);
    expect(await screen.findByText(toCyrillic('Necha kishi ketadi?'))).toBeTruthy();
    expect(tracked.find((event) => event.name === 'trip_open')).toBeTruthy();
    // «Qayerdan» and «Qayerga» are steps of the path of the passenger (G99, docs/234).
    const way = tracked.filter((event) => event.name === 'way_step').map((event) => event.step);
    expect(way).toEqual(expect.arrayContaining(['opened', 'from', 'to', 'done']));
  });

  it('finds a district by «Boshqa joy» without its region first', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { ...searchMarket([0, 0]), searchTrips } }),
    );
    await findRoute();
    await waitFor(() => expect(searchTrips).toHaveBeenCalled());
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726', to: '1730401' });
    // No trips: the sign and the ways to know about a new one in one card, rows of one kind (G78).
    expect(await screen.findByText(toCyrillic('Hozircha safar yoʻq'))).toBeTruthy();
    const rows = [...document.querySelectorAll('.learn-one > .way-row .way-row-title')];
    // The channel of Fargʻona shahri by its name in Telegram without the brand (docs/176), its lines
    // may break.
    expect(rows.map((row) => row.textContent?.replace(/\s/gu, ' '))).toEqual([
      toCyrillic('Hozircha safar yoʻq'),
      toCyrillic('Margʻilon | Fargʻona shahri'),
      toCyrillic('Xabar bering'),
      toCyrillic('Soʻrov qoldirish'),
    ]);
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
    expect(await screen.findByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: toCyrillic('Oshirish') }));
    expect(screen.getByText(/190\s000/u)).toBeTruthy();
    await tap(toCyrillic('2 ta joy band qilish'));
    expect(await screen.findByText(toCyrillic('Qayerdan, qayerga?'))).toBeTruthy();
    fireEvent.click(screen.getByText(toCyrillic('Tushirish joyi')));
    await screen.findByText(toCyrillic('Yangi Margʻilon'), {}, { timeout: 3000 });
    await tap(toCyrillic('Shu yerda tushaman'));
    await tap(toCyrillic('Soʻrov yuborish'));
    expect(await screen.findByText(toCyrillic('Javob kutilmoqda'))).toBeTruthy();
    expect(book).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ seats: 2, mode: 'pitak', wholeCar: false }),
    );
  });
});
