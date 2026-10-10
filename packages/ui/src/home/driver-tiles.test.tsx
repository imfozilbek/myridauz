import { DAY_MS, type RequestBoard } from '@platform/contracts';
import { loadBrand } from '@platform/brands';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, wallet } from '../bookings/booking-test-kit';
import type { Driver } from '../driver/driver-context';
import { tap, trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS } from './home-test-actions';
import { approved, renderHome } from './home-test-kit';

afterEach(cleanup);

const tileOf = (title: string) => screen.getByText(title).closest('button');
const badgeOf = (title: string) => tileOf(title)?.querySelector('.home-tile-badge')?.textContent;
const as = (status: Driver['application']['status']): Driver => ({
  ...approved,
  application: { ...approved.application, status, ...(status === 'draft' ? { car: null } : {}) },
});
const board: RequestBoard = {
  known: true,
  date: '2026-10-01',
  days: [
    { date: '2026-10-01', count: 3 },
    { date: '2026-10-02', count: 2 },
  ],
  trip: null,
  fits: [],
  others: [],
  carSeats: 4,
};
// The trip of tomorrow on the card, one more on Saturday with a request, one made on Tuesday.
const later = { ...trip, id: 't2', departAt: trip.departAt + DAY_MS };
const TRIPS = [
  trip,
  later,
  { ...trip, id: 't3', departAt: trip.departAt - 3 * DAY_MS, status: 'completed' as const },
];
const driver = (who: Driver, seatsLeft = 53, money = wallet) =>
  renderHome(
    () => <DriverHome />,
    DRIVER_ACTIONS,
    {
      trips: async () => TRIPS,
      requests: async () => [booking, { ...booking, id: 'b2', trip: later }],
      wallet: async () => ({ ...money, seatsLeft }),
      board: async () => board,
    },
    who,
  );

const hintOf = (title: string) => tileOf(title)?.querySelector('.home-tile-hint')?.textContent;

describe('the four tiles of a driver (G76, mockup g76/3)', { timeout: 20_000 }, () => {
  it('has the same four tiles in their order, the car and its plate on the right of the head', async () => {
    driver(approved);
    await screen.findByText('Yordam');
    const titles = [...document.querySelectorAll('.home-tiles-square .home-tile-title')].map(
      (one) => one.textContent,
    );
    expect(titles).toEqual(['Mening safarlarim', 'Suhbatlar', 'Hamyon', 'Yordam']);
    expect(screen.getByText('Cobalt, oq')).toBeTruthy();
    expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    expect(hintOf('Suhbatlar')).toBe('Yoʻlovchilar bilan');
  });

  it('counts the waiting requests, the ones of other trips as a number', async () => {
    driver(approved);
    expect(await screen.findByText('2 yangi soʻrov')).toBeTruthy();
    // The request of the nearest trip is in the block at the bottom (docs/165).
    expect(badgeOf('Mening safarlarim')).toBe('1');
  });

  it('says how many seats «Hamyon» covers and opens it', async () => {
    driver(approved);
    expect(await screen.findByText(/^≈.53 joyga yetadi$/u)).toBeTruthy();
    expect(tileOf('Hamyon')?.className).not.toContain('home-tile-soon');
    await tap('Hamyon');
    expect(await screen.findByText('Hisobni toʻldirish')).toBeTruthy();
  });

  it('turns «Hamyon» amber below 5 seats and red with «!» when a request cannot be confirmed', async () => {
    driver(approved, 4);
    expect(await screen.findByText(/^≈.4 joyga.· toʻldiring$/u)).toBeTruthy();
    expect(tileOf('Hamyon')?.className).toContain('home-tile-soon');
    cleanup();
    driver(approved, 0, { ...wallet, bonus: 0, main: 1000 });
    expect(await screen.findByText(/soʻm yetmaydi$/u)).toBeTruthy();
    expect(tileOf('Hamyon')?.className).toContain('home-tile-alarm');
    expect(badgeOf('Hamyon')).toBe('!');
  });

  it('while the application is checked: the bonus after the approval', async () => {
    driver(as('pending'));
    expect(await screen.findByText('Tasdiqdan keyin bonus')).toBeTruthy();
  });
});

describe(
  'the main screen of a driver before the application (G76, mockup g76/3 state 1)',
  { timeout: 20_000 },
  () => {
    it('asks to fill the application in the block, «Mashina · Qoʻshing» on the head, «Yordam» opens the bot', async () => {
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      driver(as('draft'));
      expect(await screen.findByText('Arizani toʻldiring')).toBeTruthy();
      expect(screen.getByText('Qoʻshing')).toBeTruthy();
      expect(screen.queryByText('Qayerdan')).toBeNull();
      await tap('Yordam');
      expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.support}`);
      open.mockRestore();
    });
  },
);
