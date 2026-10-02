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
});
