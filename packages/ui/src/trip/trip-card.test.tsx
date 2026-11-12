import { toCyrillic } from '@platform/i18n';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { confirmed } from '../bookings/booking-test-kit';
import { renderMarket } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { testClients } from '../test-shell';
import { TripCard } from './trip-card';

afterEach(cleanup);

describe('one card of a trip on the booking, the call and the review (G60, docs/118 path 3)', () => {
  it('shows the two points with their times, the seats and the sum', async () => {
    renderMarket(
      <PlacesGate>
        <TripCard booking={confirmed} />
      </PlacesGate>,
      testClients({}),
    );
    expect(await screen.findByText(toCyrillic('Chilonzor bozori yaqinida'))).toBeTruthy();
    expect(screen.getByText(/олиб кетиш жойи$/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('Registon mahallasi'))).toBeTruthy();
    expect(screen.getByText(/^≈ .* тушириш жойи$/u)).toBeTruthy();
    expect(screen.getByText(toCyrillic('2 joy'))).toBeTruthy();
    expect(screen.getByText(toCyrillic('190 000 soʻm'))).toBeTruthy();
  });

  it('leaves the sum out where the screen does not need it (the review)', async () => {
    renderMarket(
      <PlacesGate>
        <TripCard booking={confirmed} sum={false} />
      </PlacesGate>,
      testClients({}),
    );
    await screen.findByText(toCyrillic('Registon mahallasi'));
    expect(screen.queryByText(toCyrillic('2 joy'))).toBeNull();
  });

  it('after the trip shows the regions and the road, without the exact places (mockup g60/7)', async () => {
    const done = { ...confirmed, status: 'completed' as const, pickup: null, dropoff: null };
    renderMarket(
      <PlacesGate>
        <TripCard booking={done} />
      </PlacesGate>,
      testClients({}),
    );
    expect(await screen.findByText(/^≈ \d+ км · ≈ \d+ соат йўл$/u)).toBeTruthy();
    expect(screen.queryByText(/олиб кетиш жойи$/u)).toBeNull();
    expect(screen.queryByText(/тушириш жойи$/u)).toBeNull();
  });
});
