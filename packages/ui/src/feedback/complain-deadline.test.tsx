import { ApiError } from '@platform/api-client';
import { DAY_MS } from '@platform/contracts';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { DriverBooking } from '../bookings/driver-booking';
import { PlacesGate } from '../market/places-gate';
import { renderMarket, tap } from '../market/market-test-kit';
import { testClients } from '../test-shell';
import { ComplaintScreen } from './complaint-screen';

afterEach(cleanup);

const doneDaysAgo = (days: number) => ({
  ...booking,
  status: 'completed' as const,
  trip: { ...booking.trip, departAt: Date.now() - days * DAY_MS },
});

// G89 U1: a week after the trip a complaint goes through «Yordam» (docs/129): no entry that always
// fails, and the reason in words when it fails all the same.
describe('a complaint after its days', () => {
  it('has no «Shikoyat qilish» on an old booking of the driver, only on a fresh one', async () => {
    const open = (days: number) =>
      renderMarket(
        <PlacesGate>
          <DriverBooking booking={doneDaysAgo(days)} onClose={() => undefined} />
        </PlacesGate>,
        testClients({}),
      );
    const page = () => document.body.textContent ?? '';
    open(1);
    await waitFor(() => expect(page()).toContain('Xabar yozish'));
    expect(page()).toContain('Shikoyat qilish');
    cleanup();
    open(30);
    await waitFor(() => expect(page()).toContain('Xabar yozish'));
    expect(page()).not.toContain('Shikoyat qilish');
  });

  it('says the days are over', async () => {
    const complain = async () => Promise.reject(new ApiError(409, 'complaints.too_late'));
    renderMarket(
      <ComplaintScreen bookingId="b1" onBack={() => undefined} onSent={() => undefined} />,
      testClients({ feedback: { complain } }),
    );
    await tap('Xavfli haydash');
    await tap('Yuborish');
    expect(await screen.findByText('Shikoyat muddati tugagan. Yordam orqali yozing.')).toBeTruthy();
  });
});
