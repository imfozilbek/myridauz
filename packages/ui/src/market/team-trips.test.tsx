import { DAY_MS, tashkentDate } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { testClients } from '../test-shell';
import { renderMarket, trip } from './market-test-kit';
import { TeamTripsScreen } from './team-trips-screen';

afterEach(cleanup);

describe('the trips of the team day by day (docs/90 F-A6)', () => {
  it('asks the server one day at a time and shows more days on «Yana koʻrsatish»', async () => {
    const later = tashkentDate(Date.now() + 5 * DAY_MS);
    const teamTrips = vi.fn(async (date: string) =>
      date === tashkentDate(Date.now()) || date === later ? [{ ...trip, id: date }] : [],
    );
    renderMarket(<TeamTripsScreen onBack={() => undefined} />, testClients({ market: { teamTrips } }));
    expect(await screen.findByText(/^Bugun/u)).toBeTruthy();
    expect(teamTrips.mock.calls.map(([date]) => date)).toEqual(
      [-1, 0, 1, 2].map((days) => tashkentDate(Date.now() + days * DAY_MS)),
    );
    expect(screen.getAllByText(/Jasur/u)).toHaveLength(1);
    fireEvent.click(screen.getByText('Yana koʻrsatish'));
    await waitFor(() => expect(screen.getAllByText(/Jasur/u)).toHaveLength(2));
    expect(teamTrips).toHaveBeenCalledWith(later);
  });

  // «Bronni ochish» under a support question opens that trip at once (G68, mockup g68/4).
  it('a link from the support card opens the trip with its bookings; back shows the days', async () => {
    const id = '0f6c2b9e-1d2a-4c3b-9e8f-7a6b5c4d3e2f';
    window.history.replaceState(null, '', `/?open=trips&trip=${id}`);
    const tripOf = vi.fn(async () => ({ ...trip, id }));
    const tripBookings = vi.fn(async () => []);
    const teamTrips = vi.fn(async () => []);
    renderMarket(
      <TeamTripsScreen onBack={() => undefined} />,
      testClients({ market: { trip: tripOf, teamTrips }, bookings: { tripBookings } }),
    );
    await waitFor(() => expect(tripBookings).toHaveBeenCalledWith(id));
    expect(tripOf).toHaveBeenCalledWith(id);
    expect(screen.getByText('Jasur')).toBeTruthy();
    expect(window.location.search).not.toContain('trip=');
  });

  // Q5 of docs/111 (G45): the team cancels one trip with a reason, asked once more; a cancelled trip
  // has no button.
  it('cancels a trip with a reason', async () => {
    const id = '1f6c2b9e-1d2a-4c3b-9e8f-7a6b5c4d3e2f';
    window.history.replaceState(null, '', `/?open=trips&trip=${id}`);
    let status: 'active' | 'cancelled' = 'active';
    const tripOf = vi.fn(async () => ({ ...trip, id, status }));
    const cancelTrip = vi.fn(async () => void (status = 'cancelled'));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderMarket(
      <TeamTripsScreen onBack={() => undefined} />,
      testClients({
        market: { trip: tripOf, teamTrips: async () => [] },
        bookings: { tripBookings: async () => [], cancelTrip },
      }),
    );
    fireEvent.click(await screen.findByText('Safarni bekor qilish'));
    expect(screen.getByText(/komissiya qaytadi\.$/u)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Sabab'), { target: { value: 'Xavfli haydovchi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }));
    await waitFor(() => expect(cancelTrip).toHaveBeenCalledWith(id, { reason: 'Xavfli haydovchi' }));
    await waitFor(() => expect(screen.queryByText('Safarni bekor qilish')).toBeNull());
  });

  // G91 ADM-4: after «Keldi» or «Kelmadi» at the point the ride has begun and the server refuses the
  // cancel of the team (G63): the trip has no button.
  it('has no cancel once the meeting at the point began', async () => {
    const id = '2f6c2b9e-1d2a-4c3b-9e8f-7a6b5c4d3e2f';
    window.history.replaceState(null, '', `/?open=trips&trip=${id}`);
    const tripBookings = vi.fn(async () => [{ ...confirmed, metAt: trip.departAt - 60_000 }]);
    renderMarket(
      <TeamTripsScreen onBack={() => undefined} />,
      testClients({
        market: { trip: async () => ({ ...trip, id }), teamTrips: async () => [] },
        bookings: { tripBookings },
      }),
    );
    await waitFor(() => expect(tripBookings).toHaveBeenCalled());
    expect(await screen.findByText('Jasur')).toBeTruthy();
    expect(screen.queryByText('Safarni bekor qilish')).toBeNull();
  });

  // G91 ADM-2: the card of a person is the owner's (ownerOnly): for a moderator the rows of the trip
  // only read, never a tap that ends on «Xatolik».
  it('a moderator reads the driver and the passengers, the owner opens them', async () => {
    const id = '3f6c2b9e-1d2a-4c3b-9e8f-7a6b5c4d3e2f';
    for (const role of ['moderator', 'owner'] as const) {
      window.history.replaceState(null, '', `/?open=trips&trip=${id}`);
      renderMarket(
        <TeamTripsScreen onBack={() => undefined} />,
        testClients({
          market: { trip: async () => ({ ...trip, id }), teamTrips: async () => [] },
          bookings: { tripBookings: async () => [] },
          moderation: { me: async () => ({ id: null, firstName: 'Ali', hasAvatar: false, role }) },
        }),
      );
      expect(await screen.findByText('Jasur')).toBeTruthy();
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /^Jasur/u }) !== null).toBe(role === 'owner'),
      );
      cleanup();
    }
  });
});
