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
    expect(await screen.findByText('Chilonzor bozori yaqinida')).toBeTruthy();
    expect(screen.getByText(/olib ketish joyi$/u)).toBeTruthy();
    expect(screen.getByText('Registon mahallasi')).toBeTruthy();
    expect(screen.getByText(/^≈ .* tushirish joyi$/u)).toBeTruthy();
    expect(screen.getByText('2 joy')).toBeTruthy();
    expect(screen.getByText('190 000 soʻm')).toBeTruthy();
  });

  it('leaves the sum out where the screen does not need it (the review)', async () => {
    renderMarket(
      <PlacesGate>
        <TripCard booking={confirmed} sum={false} />
      </PlacesGate>,
      testClients({}),
    );
    await screen.findByText('Registon mahallasi');
    expect(screen.queryByText('2 joy')).toBeNull();
  });
});
