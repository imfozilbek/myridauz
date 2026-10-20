import type { RequestBoard, RequestBoardQuery } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import { ROUTE } from '../market/market-test-kit';
import { rememberRoute } from '../market/recent-routes';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';

const location = vi.hoisted(() => ({ herePosition: vi.fn(async () => null) }));
vi.mock('../telegram/location', () => location);
afterEach(() => {
  cleanup();
  localStorage.clear();
});

// The requests on a way: 5 from the start of the route, 2 the other way back.
const boardOf = async ({ from }: RequestBoardQuery): Promise<RequestBoard> => ({
  known: true,
  date: '2026-10-01',
  days: [{ date: '2026-10-01', count: from === ROUTE.from.id ? 5 : 2 }],
  trip: null,
  fits: [],
  others: [],
  carSeats: 4,
  busy: false,
  notify: null,
});

// G89 U14: «Yoʻnalishingizda N ta» under «Qayerga» counts the way on the screen, after «⇅» too.
describe('the count of requests of a free driver', { timeout: 20_000 }, () => {
  it('counts the new way after the ends swap', async () => {
    markApprovalSeen();
    rememberRoute({ from: ROUTE.from, to: ROUTE.to });
    renderHome(() => <DriverHome />, DRIVER_ACTIONS, {
      trips: async () => [],
      requests: async () => [],
      wallet: async () => ({ ...wallet, seatsLeft: 20 }),
      market: { requestBoard: boardOf },
    });
    expect(await screen.findByText('Yoʻnalishingizda 5 ta')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Joylarni almashtirish' }));
    expect(await screen.findByText('Yoʻnalishingizda 2 ta')).toBeTruthy();
  });
});
