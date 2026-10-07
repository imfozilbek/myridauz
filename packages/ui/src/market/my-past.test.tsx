import { arrivalAt, DAY_MS } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { renderMarket, tap } from './market-test-kit';
import { MyRequestsScreen } from './my-requests-screen';

afterEach(cleanup);

const HOUR = 60 * 60 * 1000;
const done = { ...confirmed, status: 'completed' as const, plate: null };
const arrival = arrivalAt(done.trip.departAt, done.trip.km);
const open = (rated: boolean) =>
  renderMarket(
    <MyRequestsScreen onBack={() => undefined} />,
    testClients({
      market: { myRequests: async () => [] },
      bookings: { myBookings: async () => [{ ...done, rated }], myOffers: async () => [] },
    }),
  );

describe('«Oʻtgan» in «Mening safarlarim» (G60, mockup g60/6)', () => {
  it('keeps a past trip apart from the live ones, with what is still to do', async () => {
    vi.setSystemTime(arrival + HOUR);
    open(false);
    expect(await screen.findByText('Faol (0)')).toBeTruthy();
    await tap('Oʻtgan');
    expect(screen.getByText('Baho bering · 7 kun')).toBeTruthy();
    expect(screen.getByText(/^Xabar · /u)).toBeTruthy();
  });

  it('a rated trip says so; a month later the exact points are gone', async () => {
    vi.setSystemTime(arrival + 31 * DAY_MS);
    open(true);
    await tap('Oʻtgan');
    expect(screen.getByText('Baho berildi')).toBeTruthy();
    expect(screen.getByText('Aniq joylar oʻchirildi')).toBeTruthy();
    expect(screen.queryByText(/^Xabar · /u)).toBeNull();
  });
});
