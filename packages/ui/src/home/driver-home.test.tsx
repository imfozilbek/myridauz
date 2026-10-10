import { MINUTE_MS, MY_TRIP_LINK } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, confirmed } from '../bookings/booking-test-kit';
import type { Driver } from '../driver/driver-context';
import { tap, trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS, linkOf } from './home-test-actions';
import { approved, renderHome } from './home-test-kit';

const location = vi.hoisted(() => ({
  knownPosition: vi.fn(async (): Promise<{ lat: number; lng: number } | null> => ({ lat: 41.3, lng: 69.2 })),
}));
vi.mock('../telegram/location', () => location);
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const pending: Driver = { ...approved, application: { ...approved.application, status: 'pending' } };
const driver = (trips: (typeof trip)[], requests: (typeof booking)[] = [], who: Driver = approved) =>
  renderHome(
    () => <DriverHome />,
    DRIVER_ACTIONS,
    { trips: async () => trips, requests: async () => requests, where: true },
    who,
  );

describe('what is now on the main screen of a driver (G66, mockup g66/2)', { timeout: 20_000 }, () => {
  it('shows the car and its plate in the profile', async () => {
    driver([]);
    expect(await screen.findByText('Haydovchi · Cobalt, oq · 01 A 123 BC')).toBeTruthy();
  });

  it('shows the next trip: when, the seats taken, the regions, the start and the price, the new requests', async () => {
    driver([{ ...trip, seatsLeft: 1 }], [booking, { ...booking, id: 'b2' }]);
    expect(await screen.findByText('Ertaga 08:00 · 2 / 3 joy band')).toBeTruthy();
    expect(screen.getByText('Toshkent → Fargʻona')).toBeTruthy();
    expect(screen.getByText(/^Qoʻyliq pitagidan · 95.000.soʻm$/u)).toBeTruthy();
    expect(screen.getByText('2 yangi soʻrov')).toBeTruthy();
    fireEvent.click(screen.getByText('Toshkent → Fargʻona'));
    expect(screen.getByText(linkOf({ name: MY_TRIP_LINK, id: trip.id }))).toBeTruthy();
  });

  it('on the day of the trip: the time big, how soon, the faces, and «Yoʻlga chiqdim» as the main button', async () => {
    const today = { ...trip, departAt: Date.now() + 40 * MINUTE_MS };
    const seats = ['Madina', 'Sardor', 'Dilshod'].map((firstName, n) => ({
      ...confirmed,
      id: `c${n}`,
      trip: today,
      passenger: { ...confirmed.passenger, id: `p${n}`, firstName },
    }));
    driver([today], seats);
    expect(await screen.findByText(/^Bugun \d\d:\d\d$/u)).toBeTruthy();
    expect(screen.getByText('40 daqiqadan keyin · Toshkent → Fargʻona · Qoʻyliq pitagi')).toBeTruthy();
    expect(screen.getByText('3 yoʻlovchi · hammasi tasdiqlangan')).toBeTruthy();
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Yoʻlga chiqdim' })).toBeTruthy();
    expect(screen.queryByText('Qayerga ketyapsiz?')).toBeNull();
    expect(screen.queryByText('Safar eʼlon qilish')).toBeNull();
  });

  it('keeps publishing at the bottom before the hour of the trip of today (docs/35)', async () => {
    driver([{ ...trip, departAt: Date.now() + 3 * 60 * MINUTE_MS }]);
    expect(await screen.findByText(/^Bugun \d\d:\d\d$/u)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Safar eʼlon qilish' })).toBeTruthy();
    expect(screen.queryByText('Yoʻlga chiqdim')).toBeNull();
  });

  it('shows nothing above the tiles without a trip ahead', async () => {
    driver([{ ...trip, status: 'completed' }]);
    expect(await screen.findByText('Mening safarlarim')).toBeTruthy();
    expect(screen.queryByText('Toshkent → Fargʻona')).toBeNull();
  });
});

describe('«Safar eʼlon qilish» under «Qayerdan / Qayerga» (G66, mockup g66/2)', { timeout: 20_000 }, () => {
  it('publishes the route of the block: «Qayerdan» where the driver stands, «Qayerga» from the list', async () => {
    const { tracked } = driver([]);
    expect(await screen.findByText('Joylashuvingiz boʻyicha aniqlandi')).toBeTruthy();
    await tap('Qayerga ketyapsiz?');
    await tap('Fargʻona viloyati');
    await tap('Fargʻona shahri');
    expect(await screen.findByText('Fargʻona')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Safar eʼlon qilish' }));
    expect(screen.getByText('opened Chilonzor>Fargʻona shahri')).toBeTruthy();
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'main_button' }));
  });

  it('opens publishing without a route while «Qayerga» is empty', async () => {
    driver([]);
    await screen.findByText('Joylashuvingiz boʻyicha aniqlandi');
    fireEvent.click(screen.getByRole('button', { name: 'Safar eʼlon qilish' }));
    expect(screen.getByText('opened empty')).toBeTruthy();
  });

  it('stays inert while the application is checked', async () => {
    driver([], [], pending);
    const button = await screen.findByRole('button', { name: 'Tekshiruvdan keyin ochiladi' });
    expect(button.hasAttribute('disabled')).toBe(true);
    fireEvent.click(button);
    expect(screen.queryByText(/^opened/u)).toBeNull();
  });
});
