import type { Point } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import { ROUTE } from '../market/market-test-kit';
import { rememberRoute } from '../market/recent-routes';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS, PASSENGER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';
import { PassengerHome } from './passenger-home';

// The place was never allowed before: the block knows nothing, Telegram asks at the tap only.
const location = vi.hoisted(() => ({
  herePosition: vi.fn(async (): Promise<Point | null> => null),
  requestPosition: vi.fn(async (): Promise<Point | null> => ({ lat: 41.3, lng: 69.2 })),
}));
vi.mock('../telegram/location', () => location);
afterEach(() => {
  cleanup();
  localStorage.clear();
  location.requestPosition.mockClear();
});

const HERE = 'Joylashuvingiz boʻyicha aniqlandi';
const LOCATE = 'Joylashuvim';
const CLEAR = 'Joyni tozalash';
const driver = () => {
  markApprovalSeen();
  renderHome(() => <DriverHome />, DRIVER_ACTIONS, {
    trips: async () => [],
    requests: async () => [],
    wallet: async () => ({ ...wallet, seatsLeft: 20 }),
    where: true,
  });
};
const passenger = () =>
  renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [], where: true });

// G79 В4 (owner 12.10.2026): an empty «Qayerdan» has «Joylashuvim»: one tap instead of the list.
describe.each([
  ['driver', driver],
  ['passenger', passenger],
])('«Joylashuvim» of an empty «Qayerdan» in the block of a %s', { timeout: 20_000 }, (_, open) => {
  it('fills «Qayerdan» where the person stands and says so', async () => {
    open();
    fireEvent.click(await screen.findByRole('button', { name: LOCATE }));
    expect(await screen.findByText(HERE)).toBeTruthy();
    expect(screen.getByText('Chilonzor, Toshkent shahri')).toBeTruthy();
    expect(location.requestPosition).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: LOCATE })).toBeNull();
    expect(screen.getByRole('button', { name: CLEAR })).toBeTruthy();
  });

  it('opens the list of «Qayerdan» when the place stays unknown', async () => {
    location.requestPosition.mockResolvedValueOnce(null);
    open();
    fireEvent.click(await screen.findByRole('button', { name: LOCATE }));
    expect(await screen.findByText('Qayerdan yoʻlga chiqasiz?')).toBeTruthy();
  });
});

// The owner gives the ends of a passenger their «x» too (12.10.2026).
describe('the «x» of the ends of a passenger', { timeout: 20_000 }, () => {
  it('empties «Qayerga», then «Qayerdan», whose «Joylashuvim» comes back', async () => {
    rememberRoute(ROUTE);
    passenger();
    expect(await screen.findByText('Fargʻona shahri')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: CLEAR })[1] as HTMLElement);
    expect(screen.getByText('Qayerga borasiz?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: CLEAR }));
    expect(screen.getByText('Qayerdan ketasiz?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: CLEAR })).toBeNull();
    expect(screen.getByRole('button', { name: LOCATE })).toBeTruthy();
  });
});
