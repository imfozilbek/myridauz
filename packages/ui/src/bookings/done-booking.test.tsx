import { arrivalAt } from '@platform/contracts';
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
const open = () =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [done], myOffers: async () => [] },
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
  });
});
