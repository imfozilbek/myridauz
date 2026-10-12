import type { Point } from '@platform/contracts';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS } from './home-test-actions';
import { renderHome } from './home-test-kit';

// The place was never allowed before: the block knows nothing, Telegram asks at the tap only.
const location = vi.hoisted(() => ({
  knownPosition: vi.fn(async (): Promise<Point | null> => null),
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
const driver = () => {
  markApprovalSeen();
  renderHome(() => <DriverHome />, DRIVER_ACTIONS, {
    trips: async () => [],
    requests: async () => [],
    wallet: async () => ({ ...wallet, seatsLeft: 20 }),
    where: true,
  });
};

// G79 В4 (owner 12.10.2026): an empty «Qayerdan» has «Joylashuvim»: one tap instead of the list.
describe('«Joylashuvim» of an empty «Qayerdan» in the block of a driver', { timeout: 20_000 }, () => {
  it('fills «Qayerdan» where the person stands and says so', async () => {
    driver();
    fireEvent.click(await screen.findByRole('button', { name: LOCATE }));
    expect(await screen.findByText(HERE)).toBeTruthy();
    expect(screen.getByText('Chilonzor, Toshkent shahri')).toBeTruthy();
    expect(location.requestPosition).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: LOCATE })).toBeNull();
    expect(screen.getByRole('button', { name: 'Joyni tozalash' })).toBeTruthy();
  });

  it('opens the list of «Qayerdan» when the place stays unknown', async () => {
    location.requestPosition.mockResolvedValueOnce(null);
    driver();
    fireEvent.click(await screen.findByRole('button', { name: LOCATE }));
    expect(await screen.findByText('Qayerdan yoʻlga chiqasiz?')).toBeTruthy();
  });
});
