import { DAY_MS, type Trip } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import { ROUTE, trip } from '../market/market-test-kit';
import { rememberRoute } from '../market/recent-routes';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';

const location = vi.hoisted(() => ({
  knownPosition: vi.fn(async (): Promise<{ lat: number; lng: number } | null> => ({ lat: 41.3, lng: 69.2 })),
}));
vi.mock('../telegram/location', () => location);
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const HERE = 'Joylashuvingiz boʻyicha aniqlandi';
const CLEAR = 'Joyni tozalash';
// The tests live at a fixed moment (dom-test-setup.ts): yesterday is counted from it.
const yesterday = () => ({ ...trip, departAt: Date.now() - DAY_MS, status: 'completed' as const });
const driver = (trips: Trip[] = [yesterday()], money = { ...wallet, seatsLeft: 20 }) =>
  renderHome(() => <DriverHome />, DRIVER_ACTIONS, {
    trips: async () => trips,
    requests: async () => [],
    wallet: async () => money,
    where: true,
  });
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

// G79 В4, В6а (docs/170): the block knows the last trip; the cards of the application and the money
// open what the free block opens.
describe('«Safar eʼlon qilish» of a driver from the main screen', { timeout: 20_000 }, () => {
  it('«Qayerga» of the last trip, then its answers tomorrow: ~9 taps → 2', async () => {
    markApprovalSeen();
    driver();
    await screen.findByText(HERE);
    expect(await screen.findByText('Fargʻona shahri')).toBeTruthy();
    press('Safar eʼlon qilish');
    expect(screen.getByText(/^opened Chilonzor>Fargʻona shahri again 3$/u)).toBeTruthy();
  });

  // The owner keeps the filled ends and gives each its «x» (12.10.2026): one tap empties it.
  const clear = (end: number) =>
    fireEvent.click(screen.getAllByRole('button', { name: CLEAR })[end] as HTMLElement);
  it('the «x» of «Qayerga» empties it; a new trip then asks «Qayerga» first', async () => {
    markApprovalSeen();
    driver();
    await screen.findByText(HERE);
    expect(await screen.findByText('Fargʻona shahri')).toBeTruthy();
    clear(1);
    expect(screen.queryByText('Fargʻona shahri')).toBeNull();
    expect(screen.getByText('Qayerga ketyapsiz?')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: CLEAR })).toHaveLength(1);
    press('Safar eʼlon qilish');
    expect(screen.getByText('opened from Chilonzor')).toBeTruthy();
  });

  it('the «x» of «Qayerdan» empties it; a new trip keeps «Qayerga» and asks «Qayerdan»', async () => {
    markApprovalSeen();
    driver();
    await screen.findByText(HERE);
    expect(await screen.findByText('Fargʻona shahri')).toBeTruthy();
    clear(0);
    expect(screen.queryByText(HERE)).toBeNull();
    expect(screen.getByText('Fargʻona shahri')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: CLEAR })).toHaveLength(1);
    press('Safar eʼlon qilish');
    expect(screen.getByText('opened to Fargʻona shahri')).toBeTruthy();
  });

  it('standing at the end of the last trip, «Qayerga» is the way back', async () => {
    markApprovalSeen();
    driver([{ ...yesterday(), from: trip.to, to: trip.from }]);
    await screen.findByText(HERE);
    expect(await screen.findByText('Fargʻona shahri')).toBeTruthy();
    press('Safar eʼlon qilish');
    expect(screen.getByText('opened Chilonzor>Fargʻona shahri')).toBeTruthy();
  });

  // The district found last time on this phone stands in at once: the card has no line to wait for.
  it('«Siz haydovchisiz!» publishes and shows the requests from the ends of the block', async () => {
    localStorage.setItem('here_district', trip.from);
    driver([]);
    expect(await screen.findByText('Siz haydovchisiz!')).toBeTruthy();
    press('Soʻrovlarni koʻrish');
    expect(screen.getByText(/^opened board \d+>all$/u)).toBeTruthy();
  });

  it('«Kam» publishes from the ends of the block', async () => {
    markApprovalSeen();
    localStorage.setItem('here_district', trip.from);
    driver([], { ...wallet, seatsLeft: 1 });
    expect(await screen.findByText(/joyga yetadi/u)).toBeTruthy();
    press('Safar eʼlon qilish');
    expect(screen.getByText(/^opened from Chilonzor$/u)).toBeTruthy();
  });

  // The place of the person is asked for the free block and these cards only (docs/117, review).
  it('asks nothing about the place while a trip is published', async () => {
    markApprovalSeen();
    location.knownPosition.mockClear();
    driver([trip]);
    expect(await screen.findByText(/^0 \/ 3/u)).toBeTruthy();
    expect(location.knownPosition).not.toHaveBeenCalled();
  });

  // The last search goes before the last trip, as on the mockup g76/3 phone 5 (review).
  it('shows «Qayerga» of the last search before the one of the last trip', async () => {
    markApprovalSeen();
    rememberRoute({ from: ROUTE.from, to: { ...ROUTE.to, id: '1730' } });
    driver();
    await screen.findByText(HERE);
    expect(await screen.findByText(/^Fargʻona viloyati/u)).toBeTruthy();
    expect(screen.queryByText('Fargʻona shahri')).toBeNull();
  });
});
