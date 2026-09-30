import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { testClients } from '../test-shell';
import { PlacesGate } from './places-gate';
import { renderMarket, trip } from './market-test-kit';
import { TripScreen } from './trip-screen';

afterEach(cleanup);

describe('a trip on the road (docs/65 B8)', () => {
  it('says it left instead of offering a seat', async () => {
    const left = { ...trip, departAt: Date.now() - 60 * 60 * 1000 };
    renderMarket(
      <PlacesGate>
        <TripScreen trip={left} onBack={() => undefined} onBook={() => undefined} />
      </PlacesGate>,
      testClients({}),
    );
    expect(await screen.findByText('Bu safar yoʻlga chiqqan. Joy band qilib boʻlmaydi.')).toBeTruthy();
    expect(screen.queryByText('Joy band qilish')).toBeNull();
  });
});
