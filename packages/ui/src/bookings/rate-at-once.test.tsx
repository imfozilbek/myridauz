import { arrivalAt, BOOKING_LINK, DAY_MS, type ReviewTarget } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PASSENGER_ACTIONS } from '../home/home-test-actions';
import { renderHome } from '../home/home-test-kit';
import { PassengerHome } from '../home/passenger-home';
import { renderMarket, tap, trip } from '../market/market-test-kit';
import { MyRequestsScreen } from '../market/my-requests-screen';
import { testClients } from '../test-shell';
import { confirmed } from './booking-test-kit';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const TARGET: ReviewTarget = { rateeId: '9', rateeName: 'Jasur', rateeRole: 'driver', mine: null };

// G79 П3 (docs/170): «Baho berish» of the block opens the stars at once, as for a driver (G76);
// 2 taps → 1. «Назад» from the stars goes home.
describe('«Baho berish» of a passenger', { timeout: 20_000 }, () => {
  it('the block opens the seat on its stars', async () => {
    const past = { ...trip, departAt: Date.now() - DAY_MS, firstDepartAt: Date.now() - DAY_MS };
    const done = { ...confirmed, trip: past, status: 'completed' as const };
    renderHome((go) => <PassengerHome go={go} />, PASSENGER_ACTIONS, { bookings: async () => [done] });
    await tap('Baho berish');
    expect(await screen.findByText(`opened ${BOOKING_LINK}:${done.id} end`)).toBeTruthy();
  });

  it('the seat opened on its stars shows them first, «Назад» goes home', async () => {
    const done = { ...confirmed, status: 'completed' as const, plate: null };
    vi.setSystemTime(arrivalAt(done.trip.departAt, done.trip.km) + HOUR);
    const onBack = vi.fn();
    renderMarket(
      <MyRequestsScreen onBack={onBack} link={{ name: BOOKING_LINK, id: done.id }} tripScreen="end" />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [done], myOffers: async () => [] },
        feedback: { target: async () => TARGET },
      }),
    );
    expect(await screen.findByText('Safar qanday oʻtdi?')).toBeTruthy();
    await tap('Orqaga');
    await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
  });

  // No celebration after the trip (owner decision 15.10.2026): the stars, then home at once.
  it('the stars sent go home at once, no celebration asked', async () => {
    const done = { ...confirmed, status: 'completed' as const, plate: null };
    vi.setSystemTime(arrivalAt(done.trip.departAt, done.trip.km) + HOUR);
    const onBack = vi.fn();
    const moment = vi.fn(testClients({}).growth.moment);
    renderMarket(
      <MyRequestsScreen onBack={onBack} link={{ name: BOOKING_LINK, id: done.id }} tripScreen="end" />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings: async () => [done], myOffers: async () => [] },
        feedback: { target: async () => TARGET, review: async () => undefined },
        growth: { moment },
      }),
    );
    fireEvent.click(await screen.findByRole('button', { name: '5' }));
    await tap('Yuborish');
    await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
    expect(moment).not.toHaveBeenCalled();
  });
});
