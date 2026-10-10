import { loadBrand } from '@platform/brands';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { markApprovalSeen } from '../driver/approval-seen';
import { tap } from '../market/market-test-kit';
import { DriverHome } from './driver-home';
import { DRIVER_ACTIONS } from './home-test-actions';
import { approved, renderHome } from './home-test-kit';

beforeEach(markApprovalSeen);
afterEach(cleanup);

describe('the wallet of a driver in the block at the bottom (G76, mockup g76/3 state 10)', () => {
  it('«Hisobni toʻldirish» with a low wallet sends no name and no «0 soʻm» to the support', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderHome(
      () => <DriverHome />,
      DRIVER_ACTIONS,
      { trips: async () => [], requests: async () => [], wallet: async () => ({ ...wallet, seatsLeft: 2 }) },
      approved,
    );
    await tap('Hisobni toʻldirish');
    const link = new URL(String(open.mock.calls[0]?.[0]));
    expect(link.pathname).toBe(`/${loadBrand().bots.support}`);
    expect(link.searchParams.get('text')).toBe('Salom! Hamyonimni toʻldirmoqchiman.');
    open.mockRestore();
  });
});
