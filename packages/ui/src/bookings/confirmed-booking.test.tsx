import type { ChatClient } from '@platform/api-client';
import { DAY_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { TRIP_DAY, confirmed } from './booking-test-kit';

afterEach(cleanup);

const BOARDED_AT = Date.parse('2026-10-02T03:05:00Z');
const open = (booking = confirmed, chat: Partial<ChatClient> = {}) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [booking], myOffers: async () => [] },
      chat,
    }),
  );

describe('the page of a confirmed seat (G60, mockup g60/1)', () => {
  it('shows «Joy tasdiqlandi», the driver with the plate, the one trip card and three buttons', async () => {
    vi.setSystemTime(TRIP_DAY);
    open();
    await tap('Jasur');
    expect(screen.getByText('Joy tasdiqlandi')).toBeTruthy();
    expect(screen.getByText('01 A 123 BC')).toBeTruthy();
    expect(screen.getByText(/olib ketish joyi$/u)).toBeTruthy();
    expect(screen.getByText('Pulni haydovchiga safarda oʻzingiz berasiz.')).toBeTruthy();
    for (const button of ['Xabar yozish', 'Qoʻngʻiroq', 'Yaqinlarimga', 'Shikoyat', 'Joyni bekor qilish'])
      expect(screen.getByText(button)).toBeTruthy();
  });

  it('has one main button on the way: «Mashinaga chiqdim», then «Yetib keldim»', async () => {
    vi.setSystemTime(TRIP_DAY);
    const boarded = vi.fn<ChatClient['boarded']>(async () => ({ ...confirmed, boardedAt: BOARDED_AT }));
    open(confirmed, { boarded });
    await tap('Jasur');
    await tap('Mashinaga chiqdim');
    expect(await screen.findByText('Yetib keldim')).toBeTruthy();
    expect(screen.queryByText('Mashinaga chiqdim')).toBeNull();
    // A used seat is not cancelled (docs/35).
    expect(screen.queryByText('Joyni bekor qilish')).toBeNull();
  });

  it('keeps the steps for the day of the trip (docs/89 P7)', async () => {
    const later = { ...confirmed, trip: { ...confirmed.trip, departAt: Date.now() + 2 * DAY_MS } };
    open(later);
    await tap('Jasur');
    expect(screen.getByText('Yaqinlarimga')).toBeTruthy();
    expect(screen.queryByText('Mashinaga chiqdim')).toBeNull();
  });
});
