import { MINUTE_MS, type Booking } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';

afterEach(cleanup);

const { departAt } = confirmed.trip;
// The driver came to the point and marked «Kelmadi» five minutes before the time.
const missed = { ...confirmed, noShowAt: departAt - 5 * MINUTE_MS };
const open = (booking: Booking = missed) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [booking], myOffers: async () => [] },
    }),
  );

// G91 PAS-1: after the driver's «Kelmadi» the page of the seat says what the main screen says:
// marked as not come, write to support if it is a mistake. Nothing of a live seat is left on it.
describe('the page of a seat the driver marked «Kelmadi»', () => {
  it('says so, offers support, and has no meeting, sharing or cancel', async () => {
    vi.setSystemTime(departAt - MINUTE_MS);
    open();
    // Not a live seat any more: it is with the past ones, under its mark.
    await tap('Oʻtgan');
    await tap(/^Jasur/u);
    expect(screen.getAllByText('Kelmadi deb belgilandi').length).toBeGreaterThan(0);
    expect(screen.getByText('Xato boʻlsa, yordamga yozing')).toBeTruthy();
    for (const gone of ['Joy tasdiqlandi', 'Men keldim', 'Yaqinlarimga', 'Joyni bekor qilish'])
      expect(screen.queryByText(gone)).toBeNull();
    expect(screen.getByText('Xabar yozish')).toBeTruthy();
    expect(screen.getByText('Yordam')).toBeTruthy();
  });

  it('has no stars after the trip: the ride was not hers', async () => {
    vi.setSystemTime(departAt + 6 * 60 * MINUTE_MS);
    open({ ...missed, status: 'completed' });
    await tap('Oʻtgan');
    await tap(/^Jasur/u);
    expect(screen.getByText('Kelmadi deb belgilandi')).toBeTruthy();
    expect(screen.queryByText('Baho berish')).toBeNull();
    expect(screen.queryByText('Yana Jasur bilan')).toBeNull();
  });
});

// G91 PAS-7: «Yetib keldim» of hers or «Yetib keldik» of the driver ends the ride at once (docs/129):
// the page is the page after the trip with the stars, though the server keeps the seat confirmed.
describe('the page of a seat right after the arrival', () => {
  it('is the page after the trip, with the stars', async () => {
    const arrivedAt = departAt + 3 * 60 * MINUTE_MS;
    vi.setSystemTime(arrivedAt + MINUTE_MS);
    for (const seat of [
      { ...confirmed, boardedAt: departAt, arrivedAt },
      { ...confirmed, boardedAt: departAt, trip: { ...confirmed.trip, departedAt: departAt, arrivedAt } },
    ]) {
      open(seat);
      await tap('Oʻtgan');
      await tap(/^Jasur/u);
      expect(screen.getByText('Safar tugadi')).toBeTruthy();
      expect(screen.getByText('Baho berish')).toBeTruthy();
      expect(screen.queryByText('Yaqinlarimga')).toBeNull();
      cleanup();
    }
  });
});
