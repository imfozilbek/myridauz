import type { MarketClient } from '@platform/api-client';
import { tashkentDate } from '@platform/contracts';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testClients } from '../test-shell';
import { renderMarket, tap, trip } from './market-test-kit';
import { PlacesGate } from './places-gate';
import { TripById } from './trip-link';

afterEach(cleanup);

describe('a trip that takes nobody is no dead end (docs/89 P8)', () => {
  it('leads to the other trips of the day and offers «Xabar bering»', async () => {
    const full = { ...trip, status: 'full' as const, seatsLeft: 0 };
    const searchTrips = vi.fn<MarketClient['searchTrips']>(async () => []);
    renderMarket(
      <PlacesGate>
        <TripById id={full.id} onClose={() => undefined} />
      </PlacesGate>,
      testClients({ market: { trip: async () => full, searchTrips } }),
    );
    expect(await screen.findByText('Boʻsh joy qolmagan. Boshqa safarni tanlang.')).toBeTruthy();
    expect(screen.getByText('Xabar bering')).toBeTruthy();
    await tap('Shu kungi boshqa safarlar');
    await vi.waitFor(() => expect(searchTrips).toHaveBeenCalled());
    expect(searchTrips.mock.calls[0]?.[0]).toMatchObject({
      from: full.from,
      to: full.to,
      date: tashkentDate(full.departAt),
    });
  });
});
