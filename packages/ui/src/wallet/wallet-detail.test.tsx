import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { renderMarket } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { WalletDetailScreen } from './wallet-detail-screen';

afterEach(cleanup);

const refund = {
  id: 'w9',
  kind: 'refund' as const,
  balance: 'bonus' as const,
  amount: 19_000,
  bookingId: confirmed.id,
  reason: null,
  createdAt: Date.parse('2026-10-01T06:00:00Z'),
};

describe('the details of «Qaytarildi» (G65, mockup g65/2)', () => {
  it('a refund opens too: the sum that came back and the balance it went to', async () => {
    const detail = vi.fn(async () => ({
      kind: 'refund' as const,
      amount: 19_000,
      balances: ['bonus' as const, 'main' as const],
      createdAt: Date.parse('2026-10-01T06:00:00Z'),
      booking: { ...confirmed, seats: 2, price: 95_000, commission: 19_000 },
    }));
    const open = vi.fn();
    renderMarket(
      <WalletDetailScreen operation={refund} onOpen={open} onBack={() => undefined} />,
      testClients({ wallet: { detail } }),
    );
    expect(await screen.findByText(/^\+19\s000\ssoʻm$/u)).toBeTruthy();
    expect(screen.getByText('Qaytarildi')).toBeTruthy();
    expect(screen.getByText('Qaysi hisobga')).toBeTruthy();
    expect(screen.getByText('Bonus, Asosiy')).toBeTruthy();
    screen.getByText('Safarni ochish').click();
    expect(open).toHaveBeenCalledWith({ name: 'mytrip', id: confirmed.trip.id });
  });

  it('without a way to open the trip it only shows it', async () => {
    const detail = vi.fn(async () => ({
      kind: 'commission' as const,
      amount: -19_000,
      balances: ['bonus' as const],
      createdAt: Date.parse('2026-10-01T06:00:00Z'),
      booking: confirmed,
    }));
    renderMarket(
      <WalletDetailScreen operation={refund} onBack={() => undefined} />,
      testClients({ wallet: { detail } }),
    );
    expect(await screen.findByText('Komissiya')).toBeTruthy();
    expect(screen.queryByText('Safarni ochish')).toBeNull();
  });
});
