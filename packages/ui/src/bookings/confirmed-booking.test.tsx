import type { ChatClient, GrowthClient } from '@platform/api-client';
import { DAY_MS, MINUTE_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { TRIP_DAY, confirmed } from './booking-test-kit';

afterEach(cleanup);

const BOARDED_AT = Date.parse('2026-10-02T03:05:00Z');
const open = (booking = confirmed, chat: Partial<ChatClient> = {}, growth: Partial<GrowthClient> = {}) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [booking], myOffers: async () => [] },
      chat,
      growth,
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

  it('gives «Yetib keldim» when the driver forgot «Keldi»: the meeting minutes after the time (G76)', async () => {
    vi.setSystemTime(confirmed.trip.departAt + 31 * MINUTE_MS);
    open();
    await tap('Jasur');
    expect(screen.getByText('Yetib keldim')).toBeTruthy();
  });

  it('keeps the steps for the day of the trip (docs/89 P7)', async () => {
    const later = { ...confirmed, trip: { ...confirmed.trip, departAt: Date.now() + 2 * DAY_MS } };
    open(later);
    await tap('Jasur');
    expect(screen.getByText('Yaqinlarimga')).toBeTruthy();
    expect(screen.queryByText('Yetib keldim')).toBeNull();
  });

  it('calls a friend to the free seats of the car, only while it has some (G69, docs/123 loop 3)', async () => {
    vi.setSystemTime(TRIP_DAY);
    const loopCard = vi.fn<GrowthClient['loopCard']>(async () => ({
      prepared: null,
      link: 'https://t.me/p',
    }));
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    open({ ...confirmed, trip: { ...confirmed.trip, seatsLeft: 2 } }, {}, { loopCard });
    await tap('Jasur');
    expect(screen.getByText('Bu safarda yana 2 ta joy bor')).toBeTruthy();
    await tap('Doʻstingni chaqir');
    await vi.waitFor(() => expect(opened).toHaveBeenCalled());
    expect(loopCard).toHaveBeenCalledWith({ loop: 'seats', bookingId: confirmed.id });
    opened.mockRestore();
    cleanup();
    open({ ...confirmed, trip: { ...confirmed.trip, seatsLeft: 0, status: 'full' } });
    await tap('Jasur');
    expect(screen.queryByText('Doʻstingni chaqir')).toBeNull();
  });
});
