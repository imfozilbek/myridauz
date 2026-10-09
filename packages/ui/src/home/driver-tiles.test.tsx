import { DAY_MS, type RequestBoard } from '@platform/contracts';
import { loadBrand } from '@platform/brands';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking, wallet } from '../bookings/booking-test-kit';
import type { Driver } from '../driver/driver-context';
import { tap, trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRAFT_ACTIONS, DRIVER_ACTIONS } from './home-test-actions';
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
const driver = (who: Driver, seatsLeft = 53) =>
  renderHome(
    (go) => <DriverHome go={go} />,
    who.application.status === 'draft' ? DRAFT_ACTIONS : DRIVER_ACTIONS,
    {
      trips: async () => TRIPS,
      requests: async () => [booking, { ...booking, id: 'b2', trip: later }],
      wallet: async () => ({ ...wallet, seatsLeft }),
      board: async () => board,
    },
    who,
  );

describe('the tiles of a driver (G66, mockup g66/2)', { timeout: 20_000 }, () => {
  it('counts the requests on the directions of the driver and the trips of the week', async () => {
    driver(approved);
    expect(await screen.findByText('Yoʻnalishingizda 5 ta')).toBeTruthy();
    expect(badgeOf('Yoʻlovchilar soʻrovlari')).toBe('5');
    expect(await screen.findByText('Bu hafta 3 ta safar')).toBeTruthy();
    // The requests of the trip on the card stay on the card (mockup g66/2 phone 3).
    expect(badgeOf('Mening safarlarim')).toBe('1');
  });

  it('says how many seats «Hamyon» covers and opens it', async () => {
    driver(approved);
    expect(await screen.findByText(/^≈.53 joyga yetadi$/u)).toBeTruthy();
    expect(tileOf('Hamyon')?.className).not.toContain('home-tile-alarm');
    await tap('Hamyon');
    expect(await screen.findByText('Hisobni toʻldirish')).toBeTruthy();
  });

  it('turns «Hamyon» red below 5 seats', async () => {
    driver(approved, 4);
    expect(await screen.findByText(/^≈.4 joyga.· toʻldiring$/u)).toBeTruthy();
    expect(tileOf('Hamyon')?.className).toContain('home-tile-alarm');
  });

  it('opens the profile from «Profil», «Yordam» lives there (mockup g65/3)', async () => {
    const { tracked } = driver(approved);
    expect(await screen.findByText('Mashina va sozlamalar')).toBeTruthy();
    expect(screen.queryByText('Yordam')).toBeNull();
    await tap('Mashina va sozlamalar');
    expect(tracked).toContainEqual(expect.objectContaining({ name: 'screen_open', screen: 'profile' }));
  });

  it('while the application is checked: the bonus waiting, «Mening safarlarim» after the check', async () => {
    driver(as('pending'));
    // 3 bonuses of 500 000 soʻm (docs/12).
    expect(await screen.findByText(/^Bonus 1.500.000.soʻm$/u)).toBeTruthy();
    expect(screen.getByText('Tekshiruvdan keyin')).toBeTruthy();
  });
});

describe(
  'the main screen of a driver before the application (mockup g62/1 screen 1)',
  { timeout: 20_000 },
  () => {
    it('says «Haydovchi», keeps publishing pale, «Yordam» opens the support bot, no block at the bottom', async () => {
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      driver(as('draft'));
      expect(await screen.findByText('Haydovchi')).toBeTruthy();
      expect(tileOf('Safar eʼlon qilish')?.className).toContain('home-tile-pale');
      expect(screen.getByText('Eʼlonlar')).toBeTruthy();
      expect(screen.queryByText('Qayerdan')).toBeNull();
      await tap('Savol boʻlsa');
      expect(open.mock.calls[0]?.[0]).toBe(`https://t.me/${loadBrand().bots.support}`);
      open.mockRestore();
    });
  },
);
