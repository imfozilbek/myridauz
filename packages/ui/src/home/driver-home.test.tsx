import { MINUTE_MS, MY_TRIP_LINK } from '@platform/contracts';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { booking, confirmed } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import type { Driver } from '../driver/driver-context';
import { tap, trip } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS, linkOf } from './home-test-actions';
import { approved, renderHome } from './home-test-kit';

const location = vi.hoisted(() => ({
  knownPosition: vi.fn(async (): Promise<{ lat: number; lng: number } | null> => ({ lat: 41.3, lng: 69.2 })),
}));
vi.mock('../telegram/location', () => location);
// «Siz haydovchisiz!» was told on an earlier visit (G62).
beforeEach(markApprovalSeen);
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
const dock = async () => within(await screen.findByTestId('home-dock'));

describe(
  'the main screen of a driver: the head and the block at the bottom (G76, mockup g76/3)',
  { timeout: 20_000 },
  () => {
    it('shows the car and its plate on the right of the head', async () => {
      driver([]);
      expect(await screen.findByText('Cobalt, oq')).toBeTruthy();
      expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    });

    it('shows the published trip: when, the seats taken, «Safarni ochish» opens it', async () => {
      driver([{ ...trip, seatsLeft: 1 }]);
      expect(await screen.findByText('2 / 3 joy band')).toBeTruthy();
      expect((await dock()).getByText('Ertaga 08:00')).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Safarni ochish' }));
      expect(screen.getByText(linkOf({ name: MY_TRIP_LINK, id: trip.id }))).toBeTruthy();
    });

    it('puts the new requests of a trip first with «Javob berish»', async () => {
      driver([trip], [booking, { ...booking, id: 'b2' }]);
      expect(await screen.findByRole('button', { name: 'Javob berish' })).toBeTruthy();
      expect((await dock()).getByText('2 yangi soʻrov')).toBeTruthy();
    });

    it('on the hour of the trip: the minutes, the people, and «Yoʻlga chiqdim» as the main button', async () => {
      const today = { ...trip, departAt: Date.now() + 40 * MINUTE_MS };
      const seats = ['Madina', 'Sardor', 'Dilshod'].map((firstName, n) => ({
        ...confirmed,
        id: `c${n}`,
        trip: today,
        passenger: { ...confirmed.passenger, id: `p${n}`, firstName },
      }));
      driver([today], seats);
      expect(await screen.findByText('3 yoʻlovchi · hammasi tasdiqlangan')).toBeTruthy();
      expect(screen.getByText('40 daq')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Yoʻlga chiqdim' })).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Safar eʼlon qilish' })).toBeNull();
    });

    it('is free without a trip ahead', async () => {
      driver([{ ...trip, status: 'completed' }]);
      expect(await screen.findByText('Joylashuvingiz boʻyicha aniqlandi')).toBeTruthy();
      expect(screen.queryByText('2 / 3 joy band')).toBeNull();
    });
  },
);

describe(
  'the free block: «Soʻrovlarni koʻrish» and «Safar eʼlon qilish» (G76, docs/165)',
  { timeout: 20_000 },
  () => {
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

    it('only «Qayerdan» is enough: publishing asks «Qayerga» there', async () => {
      driver([]);
      await screen.findByText('Joylashuvingiz boʻyicha aniqlandi');
      fireEvent.click(screen.getByRole('button', { name: 'Safar eʼlon qilish' }));
      expect(screen.getByText(/^opened from /u)).toBeTruthy();
    });

    it('opens the requests of passengers from «Qayerdan» to every side', async () => {
      const { tracked } = driver([]);
      await screen.findByText('Joylashuvingiz boʻyicha aniqlandi');
      fireEvent.click(screen.getByRole('button', { name: 'Soʻrovlarni koʻrish' }));
      expect(tracked).toContainEqual(expect.objectContaining({ name: 'home_tap', target: 'dock_requests' }));
    });

    it('keeps both buttons grey with a note while the application is checked', async () => {
      driver([], [], pending);
      expect(await screen.findByText('Tekshiruvdan keyin ochiladi. Odatda 30 daqiqagacha.')).toBeTruthy();
      const button = screen.getByRole('button', { name: 'Safar eʼlon qilish' });
      expect(button.hasAttribute('disabled')).toBe(true);
      expect(screen.getByRole('button', { name: 'Soʻrovlarni koʻrish' }).hasAttribute('disabled')).toBe(true);
      fireEvent.click(button);
      expect(screen.queryByText(/^opened/u)).toBeNull();
    });
  },
);
