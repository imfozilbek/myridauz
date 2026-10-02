import type { BookingsClient } from '@platform/api-client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { booking } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { pullDown, rows, scrolledTo, skeleton } from './list-test-kit';
import { renderMarket, tap, trip } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';
import { MyTripsScreen } from './my-trips-screen';

afterEach(cleanup);

const TRIPS = Array.from({ length: 12 }, (_, index) => ({ ...trip, id: `t${index}` }));

// The person leaves «Mening safarlarim» upwards and comes again.
function Host() {
  const [open, setOpen] = useState(true);
  if (!open) return <button onClick={() => setOpen(true)}>again</button>;
  return <MyTripsScreen onBack={() => setOpen(false)} />;
}

describe('«Mening safarlarim» after «Назад» (docs/94 F2, S3, W1)', { timeout: 20_000 }, () => {
  it('a driver comes back from a trip to the same page and place; leaving, the list opens fresh', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo');
    renderMarket(
      <Host />,
      testClients({
        market: { myTrips: async () => TRIPS },
        bookings: { driverBookings: async () => [], driverOffers: async () => [] },
      }),
    );
    await tap('Yana koʻrsatish');
    expect(rows()).toHaveLength(12);
    scrolledTo(900);
    const last = screen.getAllByText('Faol')[11];
    if (last) fireEvent.click(last);
    await tap('Orqaga');
    expect(skeleton()).toBeNull();
    expect(rows()).toHaveLength(12);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 900);
    await tap('Orqaga');
    scrollTo.mockClear();
    await tap('again');
    await waitFor(() => expect(rows()).toHaveLength(10));
    expect(scrollTo).not.toHaveBeenCalledWith(0, 900);
  });

  it('a passenger pulls the list down: it refreshes without a skeleton, the cards are rows', async () => {
    const myBookings = vi.fn<BookingsClient['myBookings']>(async () => [booking]);
    renderMarket(
      <MyRequestsScreen onBack={() => undefined} />,
      testClients({
        market: { myRequests: async () => [] },
        bookings: { myBookings, myOffers: async () => [] },
      }),
    );
    await waitFor(() => expect(rows()).toEqual(['booking:b1']));
    await pullDown();
    expect(myBookings).toHaveBeenCalledTimes(2);
    expect(skeleton()).toBeNull();
  });
});
