import type { BookingsClient, MarketClient } from '@platform/api-client';
import { booking } from '../bookings/booking-test-kit';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { FindTripFlow } from './find-trip-flow';
import { chooseWay, renderMarket, tap, trip } from './market-test-kit';

afterEach(cleanup);

describe('FindTripFlow: a passenger looks for a trip (docs/06, docs/14)', () => {
  it('searches the districts of the way on a day, filters "ayol bor" and opens a trip', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => [trip]);
    const book = vi.fn<BookingsClient['book']>(async () => booking);
    const { tracked } = renderMarket(
      <FindTripFlow onBack={() => undefined} />,
      testClients({ market: { searchTrips }, bookings: { book } }),
    );
    await chooseWay();
    await tap(/^Bugun/);
    expect(await screen.findByText('Jasur')).toBeTruthy();
    // Every stop shows two levels: the place and its region, and the arrival is approximate.
    expect(screen.getAllByText('Toshkent shahri').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^≈ \d\d:\d\d$/).length).toBeGreaterThan(0);
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({ from: '1726269', to: '1730401', mode: 'door' });
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(searchTrips.mock.calls.at(-1)?.[0]).toMatchObject({ woman: '1' }));
    await tap('Jasur');
    expect(await screen.findByText('Jasur')).toBeTruthy();
    // The way of the driver (docs/70); no pitak in this direction: the passenger chose the door.
    expect(screen.getByText('Uyingizdan yoki Qoʻyliq pitagidan')).toBeTruthy();
    await tap('Joy band qilish');
    await tap('2 kishi');
    expect(await screen.findByText('Joy soʻrash')).toBeTruthy();
    expect(screen.getByText(/190\s000/)).toBeTruthy();
    await tap('Soʻrov yuborish');
    expect(await screen.findByText('Soʻrov yuborildi')).toBeTruthy();
    const center = { lat: 41, lng: 69 };
    expect(book).toHaveBeenCalledWith('t1', { seats: 2, mode: 'door', pickup: center, dropoff: center });
    expect(tracked.filter((event) => event.name === 'booking_step').map((event) => event.step)).toEqual([
      'seats',
      'requested',
    ]);
    expect(tracked.some((event) => event.name === 'trip_open')).toBe(true);
    expect(tracked.find((event) => event.name === 'trip_search')).toMatchObject({ result: 'found' });
  });

  it('says so when nothing is found, and a calendar day can be chosen', async () => {
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(<FindTripFlow onBack={() => undefined} />, testClients({ market: { searchTrips } }));
    await chooseWay();
    await tap('Boshqa kun');
    const day = screen.getByLabelText('Qaysi kuni?') as HTMLInputElement;
    fireEvent.change(day, { target: { value: day.min } });
    await tap('Davom etish');
    expect(await screen.findByText('Bu kunga safar topilmadi')).toBeTruthy();
  });
});
