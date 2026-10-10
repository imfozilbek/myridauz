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
    expect(screen.getByRole('img', { name: '01 A 123 BC' })).toBeTruthy();
    expect(screen.getByText(/olib ketish joyi$/u)).toBeTruthy();
    expect(screen.getByText('Pulni haydovchiga safarda oʻzingiz berasiz.')).toBeTruthy();
    for (const button of ['Xabar yozish', 'Qoʻngʻiroq', 'Yaqinlarimga', 'Shikoyat', 'Joyni bekor qilish'])
      expect(screen.getByText(button)).toBeTruthy();
  });

  // The driver's «Keldi» puts the passenger in the car (G76, owner decision 10.10.2026, docs/43).
  it('has no step before the driver marks the passenger in, then «Yetib keldim»', async () => {
    vi.setSystemTime(TRIP_DAY);
    open();
    await tap('Jasur');
    expect(screen.queryByText('Yetib keldim')).toBeNull();
    cleanup();
    const arrived = vi.fn<ChatClient['arrived']>(async () => ({
      ...confirmed,
      boardedAt: BOARDED_AT,
      arrivedAt: BOARDED_AT,
    }));
    open({ ...confirmed, boardedAt: BOARDED_AT }, { arrived });
    await tap('Jasur');
    // A used seat is not cancelled (docs/35).
    expect(screen.queryByText('Joyni bekor qilish')).toBeNull();
    await tap('Yetib keldim');
    expect(arrived).toHaveBeenCalledWith(confirmed.id);
    expect(await screen.findByText('Yaqinlaringizga xabar berildi')).toBeTruthy();
    expect(screen.queryByText('Yetib keldim')).toBeNull();
  });

  it('keeps the steps for the day of the trip (docs/89 P7)', async () => {
    const later = { ...confirmed, trip: { ...confirmed.trip, departAt: Date.now() + 2 * DAY_MS } };
    open(later);
    await tap('Jasur');
    expect(screen.getByText('Yaqinlarimga')).toBeTruthy();
    expect(screen.queryByText('Yetib keldim')).toBeNull();
  });
});
