import { DAY_MS, tashkentDate } from '@platform/contracts';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    expect(screen.getAllByText('Jasur')).toHaveLength(1);
    fireEvent.click(screen.getByText('Yana koʻrsatish'));
    await waitFor(() => expect(screen.getAllByText('Jasur')).toHaveLength(2));
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
});
