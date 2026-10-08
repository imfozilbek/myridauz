import { cleanup, screen } from '@testing-library/react';
import type { Trip } from '@platform/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { renderMarket, trip } from '../market/market-test-kit';
import { PlacesGate } from '../market/places-gate';
import { TripCard } from '../market/trip-card';
import { DirectionEdit } from '../pricing/direction-edit';
import { testClients } from '../test-shell';

afterEach(cleanup);

describe('prices next to each other (docs/40, question 44)', () => {
  it('shows the recommended price under the driver price', async () => {
    const cheap: Trip = { ...trip, price: 80000 };
    renderMarket(
      <PlacesGate>
        <TripCard trip={cheap} onOpen={() => undefined} />
      </PlacesGate>,
      testClients({}),
    );
    expect(await screen.findByText('Tavsiya: 95 000 soʻm')).toBeTruthy();
  });

  it('gives the team the median only as a hint while editing a direction (docs/09)', async () => {
    const direction = { from: '1726269', to: '1730401', km: 320, formula: 95000, manual: null };
    const edit = (median: number | null, medianTrips: number) => (
      <PlacesGate>
        <DirectionEdit
          direction={{ ...direction, median, medianTrips }}
          failed={null}
          onBack={() => undefined}
          onSave={() => undefined}
        />
      </PlacesGate>
    );
    renderMarket(edit(90000, 12), testClients({}));
    expect(await screen.findByText('Haqiqiy narxlar medianasi')).toBeTruthy();
    expect(screen.getByText('90 000 soʻm')).toBeTruthy();
    cleanup();
    renderMarket(edit(null, 4), testClients({}));
    expect(await screen.findByText(/kamida 10 ta safar kerak\. Hozir: 4 ta/u)).toBeTruthy();
  });
});
