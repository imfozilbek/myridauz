import { FAR_EXTRA_KM, tashkentDate } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { publishTrip } from './application/publish';
import { searchTrips } from './application/read';
import { NOW, setup } from './test-kit';

// Tashkent (Mirobod, Qibray far to the north-east) → Samarkand (Registon).
const MIROBOD = { lat: 41.292, lng: 69.279 };
const QIBRAY = { lat: 41.39, lng: 69.4 };
const REGISTON = { lat: 39.6547, lng: 66.9758 };

describe('the trips that suit first (G24, docs/70)', () => {
  it('puts the trips of the way first, the near ones above, the others below with a mark', async () => {
    const { deps, trip, ride } = setup();
    const publish = async (pickupMode: 'pitak' | 'door' | 'both') => {
      const published = await publishTrip(deps, 1, { ...trip, pickupMode });
      return published.ok ? published.value.id : '';
    };
    const pitakOnly = await publish('pitak');
    const far = await publish('door');
    const near = await publish('both');
    ride({ tripId: far, passengerId: 3, seats: 1, pickup: QIBRAY, dropoff: REGISTON });
    ride({ tripId: near, passengerId: 3, seats: 1, pickup: MIROBOD, dropoff: REGISTON });
    const search = {
      from: '1726',
      to: '1718',
      date: tashkentDate(NOW),
      mode: 'door' as const,
      pickup: MIROBOD,
      dropoff: REGISTON,
    };
    const found = await searchTrips(deps, search);
    expect(found.map((item) => item.id)).toEqual([near, far, pitakOnly]);
    expect(found.map((item) => item.fit?.matches)).toEqual([true, true, false]);
    expect(found[0]?.fit?.extraKm).toBe(0);
    expect(found[1]?.fit?.extraKm).toBeGreaterThan(FAR_EXTRA_KM);
  });

  it('leaves the search as it was without the way of the passenger', async () => {
    const { deps, trip } = setup();
    await publishTrip(deps, 1, trip);
    const found = await searchTrips(deps, { from: '1726', to: '1718', date: tashkentDate(NOW) });
    expect(found[0]?.fit).toBeNull();
  });
});
