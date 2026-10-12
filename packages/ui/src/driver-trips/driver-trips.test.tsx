import type { Booking, Trip } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { DriverContext } from '../driver/driver-context';
import { approved } from '../home/home-test-kit';
import { recommendation, renderMarket, tap, trip } from '../market/market-test-kit';
import { MyTripsScreen } from '../market/my-trips-screen';
import { testClients } from '../test-shell';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// 06:00 in Tashkent on the day of the trip of the kit (08:00, Chilonzor → Fargʻona).
const NOW = trip.departAt - 2 * HOUR;
const full: Trip = { ...trip, id: 't2', departAt: trip.departAt + DAY, seatsLeft: 0 };
const back: Trip = {
  ...trip,
  id: 't3',
  from: trip.to,
  to: trip.from,
  departAt: trip.departAt + DAY + 7 * HOUR,
  seatsLeft: 4,
};
const done: Trip = {
  ...trip,
  id: 't0',
  departAt: trip.departAt - DAY,
  status: 'completed',
  arrivedAt: NOW - DAY,
};
const asked: Booking = { ...booking, trip };

beforeEach(() => void vi.useFakeTimers({ toFake: ['Date'], now: NOW }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function open(trips: readonly Trip[] = [trip, full, back, done]) {
  renderMarket(
    <DriverContext.Provider value={approved}>
      <MyTripsScreen onBack={() => undefined} />
    </DriverContext.Provider>,
    testClients({
      market: {
        myTrips: async () => [...trips],
        month: async () => ({ trips: 8, costs: 2_150_000 }),
        recommend: async () => recommendation,
      },
      bookings: { driverBookings: async () => [asked], driverOffers: async () => [] },
    }),
  );
}
const rows = () => document.querySelectorAll('.driver-trip');

describe('«Mening safarlarim» of a driver (G64, docs/118 path 7, mockup g64/6)', { timeout: 20_000 }, () => {
  it('shows the live trips with their marks, the week with dots and the month', async () => {
    open();
    expect(await screen.findByText('Faol (3)')).toBeTruthy();
    expect(rows()).toHaveLength(3);
    expect(screen.getByText('bugun · 08:00')).toBeTruthy();
    expect(screen.getByText('1 ta yangi soʻrov')).toBeTruthy();
    expect(screen.getByText('3 boʻsh joy')).toBeTruthy();
    expect(screen.getByText('4 boʻsh joy')).toBeTruthy();
    expect(screen.getByText('Hamma joy band')).toBeTruthy();
    expect(screen.getByText('Qaytish safari · 95 000')).toBeTruthy();
    expect(screen.getAllByText('Qoʻyliq pitagi · 95 000')).toHaveLength(2);
    expect(document.querySelectorAll('.week-dot:not(.week-dot-none)')).toHaveLength(2);
    expect(await screen.findByText('8 safar')).toBeTruthy();
    expect(screen.getByText('2 150 000')).toBeTruthy();
  });

  it('shows the trips of a tapped day only, all of them again on the second tap', async () => {
    open();
    await screen.findByText('Faol (3)');
    const tomorrow = screen.getByText('3').closest('button') as HTMLElement;
    fireEvent.click(tomorrow);
    expect(rows()).toHaveLength(2);
    expect(tomorrow.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(tomorrow);
    expect(rows()).toHaveLength(3);
  });

  // G78 sheet 3: a past trip is the row of «Faol», in the words of its card.
  it('keeps the trips that are over on «Oʻtgan» in rows', async () => {
    open();
    await tap('Oʻtgan');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(screen.getByText('Uyingizdan yoki Qoʻyliq pitagidan · 95 000')).toBeTruthy();
    expect(screen.queryByText('Oʻtgan safar yoʻq')).toBeNull();
  });

  // G78 sheet 3: an empty tab says so in a row; the rest stays under it.
  it('says «Faol safar yoʻq» and «Oʻtgan safar yoʻq» in a row', async () => {
    open([done]);
    expect(await screen.findByText('Faol safar yoʻq')).toBeTruthy();
    expect(screen.getByText('Ertaga shu safar')).toBeTruthy();
    cleanup();
    open([trip]);
    await tap('Oʻtgan');
    expect(await screen.findByText('Oʻtgan safar yoʻq')).toBeTruthy();
    expect(screen.getByText('Obunalar')).toBeTruthy();
  });

  it('an empty list publishes a trip (G78 sheet 3)', async () => {
    open([]);
    expect(await screen.findByText('Hali safarlaringiz yoʻq')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Safar eʼlon qilish' }));
    expect(await screen.findByText('Qayerdan yoʻlga chiqasiz?')).toBeTruthy();
  });

  it('«Ertaga shu safar» repeats the last trip tomorrow at its time on the publishing', async () => {
    // No live trip (one at a time, docs/172): the publishing opens, not the limit.
    open([done]);
    const again = (await screen.findByText('Ertaga shu safar')).closest('button') as HTMLElement;
    expect(within(again).getByText('Chilonzor → Fargʻona · 08:00')).toBeTruthy();
    fireEvent.click(again);
    expect(await screen.findByText('Ertaga, 08:00')).toBeTruthy();
    expect(screen.getByText('Chilonzor, Toshkent shahri')).toBeTruthy();
    expect(screen.getByText('Fargʻona shahri')).toBeTruthy();
  });

  it('offers no repeat while no trip has left yet, nor while a trip is live (docs/172)', async () => {
    open([trip]);
    await screen.findByText('Faol (1)');
    expect(screen.queryByText('Ertaga shu safar')).toBeNull();
    cleanup();
    open([trip, done]);
    await screen.findByText('Faol (1)');
    expect(screen.queryByText('Ertaga shu safar')).toBeNull();
  });
});
