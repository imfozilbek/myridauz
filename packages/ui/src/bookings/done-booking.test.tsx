import { arrivalAt, NOBODY_ID } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMarket, tap } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const done = { ...confirmed, status: 'completed' as const, plate: null };
const arrival = arrivalAt(done.trip.departAt, done.trip.km);
const open = (booking = done) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [booking], myOffers: async () => [] },
    }),
  );

describe('a past trip (G60, mockups g60/6 and g60/7)', () => {
  it('says the trip ended and shows what may still be done, each with its deadline', async () => {
    vi.setSystemTime(arrival + HOUR);
    open();
    await tap('Oʻtgan');
    await tap(/^Jasur/u);
    expect(screen.getByText('Safar tugadi')).toBeTruthy();
    expect(screen.getByText(/^Rida orqali:/u)).toBeTruthy();
    expect(screen.getAllByText(/gacha$/u)).toHaveLength(2);
    expect(screen.getByText('Baho berish')).toBeTruthy();
    expect(screen.getByText(/^Shikoyat · 7 kun qoldi$/u)).toBeTruthy();
    expect(screen.getByText('Yana Jasur bilan')).toBeTruthy();
    expect(screen.queryByText('Joyni bekor qilish')).toBeNull();
  });

  it('a month later: no chat, no call, no rating, the complaint through «Yordam»', async () => {
    vi.setSystemTime(arrival + 31 * 24 * HOUR);
    open();
    await tap('Oʻtgan');
    await tap(/^Jasur/u);
    expect(screen.queryAllByText(/gacha$/u)).toHaveLength(0);
    expect(screen.getAllByText('muddat tugadi').length).toBeGreaterThan(0);
    expect(screen.getByText('Shikoyat: Yordam orqali')).toBeTruthy();
    // The exact places are gone, the plate is grey (mockup g60/6).
    expect(screen.getByText('Aniq joylar oʻchirildi: faqat tuman qoldi.')).toBeTruthy();
    expect(screen.queryByText(/^Rida orqali:/u)).toBeNull();
  });

  // G89 M9: the driver deleted the account. The ride stays to rate and to complain; there is nobody
  // to write, to call or to ride with again.
  it('of a driver who deleted the account: no chat, no call, no «Yana … bilan»', async () => {
    vi.setSystemTime(arrival + HOUR);
    const gone = { ...done.trip.driver, id: NOBODY_ID, firstName: 'Hisob oʻchirilgan' };
    open({ ...done, trip: { ...done.trip, driver: gone } });
    await tap('Oʻtgan');
    await tap(/^Hisob oʻchirilgan/u);
    expect(screen.getByText('Baho berish')).toBeTruthy();
    expect(screen.queryByText('Xabar yozish')).toBeNull();
    expect(screen.queryByText('Qoʻngʻiroq')).toBeNull();
    expect(screen.queryByText('Yana Hisob oʻchirilgan bilan')).toBeNull();
  });
});
