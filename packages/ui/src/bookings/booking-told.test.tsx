import type { ChatClient } from '@platform/api-client';
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';

afterEach(cleanup);

const BOARDED_AT = Date.parse('2026-10-02T03:05:00Z');

describe('«Mashinaga chiqdim» changes the whole booking screen at once (docs/88 L6)', () => {
  it('marks the step on the way and hides the cancel of a used seat', async () => {
    const boarded = vi.fn<ChatClient['boarded']>(async () => ({ ...confirmed, boardedAt: BOARDED_AT }));
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [] },
        chat: { boarded },
      }),
    );
    await tap('Jasur');
    expect(screen.getByText('Joyni bekor qilish')).toBeTruthy();
    await tap('Mashinaga chiqdim');
    const steps = within(screen.getByRole('list', { name: 'Holati' })).getAllByRole('listitem');
    await vi.waitFor(() => expect(steps[2]?.textContent).toMatch(/\d{2}:\d{2}/u));
    expect(screen.queryByText('Joyni bekor qilish')).toBeNull();
  });
});
