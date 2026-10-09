import { NO_SHOW_REASON } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wallet } from '../bookings/booking-test-kit';
import { renderInShell } from '../test-shell';
import { WalletRows } from './wallet-rows';

afterEach(cleanup);

const refund = {
  id: 'w3',
  kind: 'admin_adjustment' as const,
  balance: 'bonus' as const,
  amount: 9500,
  bookingId: 'a1',
  reason: NO_SHOW_REASON,
  createdAt: Date.parse('2026-10-08T07:00:00Z'),
  passenger: 'Akmal',
};

describe('the refund of a no-show in «Hamyon» (docs/129, mockup g63/5 phone 6)', () => {
  it('names the passenger and the owner who confirmed it', () => {
    vi.setSystemTime(Date.parse('2026-10-08T10:00:00Z'));
    renderInShell(<WalletRows operations={[refund, ...wallet.operations]} onOpen={() => undefined} />);
    expect(screen.getByText('Qaytarildi · Akmal kelmadi')).toBeTruthy();
    expect(screen.getByText('Bugun · egasi tasdiqladi')).toBeTruthy();
    expect(screen.getByText(/^\+9.500$/u)).toBeTruthy();
    // Every other row stays as it was; the start bonus is named so (G65, mockup g65/1).
    expect(screen.getByText('Boshlash bonusi')).toBeTruthy();
  });
});
