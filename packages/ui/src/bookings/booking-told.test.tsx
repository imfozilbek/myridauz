import { ApiError, type ChatClient } from '@platform/api-client';
import { DAY_MS } from '@platform/contracts';
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { TRIP_DAY, confirmed } from './booking-test-kit';

afterEach(cleanup);

const BOARDED_AT = Date.parse('2026-10-02T03:05:00Z');

describe('«Mashinaga chiqdim» changes the whole booking screen at once (docs/88 L6)', () => {
  it('marks the step on the way and hides the cancel of a used seat', async () => {
    vi.setSystemTime(TRIP_DAY);
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

describe('«Mashinaga chiqdim» and «Yetib keldim» only on the day of the trip (docs/89 P7)', () => {
  it('hides them for a trip of another day and keeps the card for the close people', async () => {
    const tomorrow = { ...confirmed, trip: { ...confirmed.trip, departAt: Date.now() + 2 * DAY_MS } };
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [tomorrow], myOffers: async () => [] },
      }),
    );
    await tap('Jasur');
    expect(screen.getByText('Yaqinlarimga yuborish')).toBeTruthy();
    expect(screen.queryByText('Mashinaga chiqdim')).toBeNull();
    expect(screen.queryByText('Yetib keldim')).toBeNull();
  });
});

describe('«Yaqinlarim» says why a step did not work (G43, docs/65 B3)', () => {
  it('shows the reason under the tools', async () => {
    vi.setSystemTime(TRIP_DAY);
    const boarded = vi.fn<ChatClient['boarded']>(async () => {
      throw new ApiError(409, 'shares.wrong_status');
    });
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [confirmed], myOffers: async () => [] },
        chat: { boarded },
      }),
    );
    await tap('Jasur');
    await tap('Mashinaga chiqdim');
    expect((await screen.findByRole('alert')).textContent).not.toBe('');
  });
});
