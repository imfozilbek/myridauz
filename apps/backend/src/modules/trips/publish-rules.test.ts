import { describe, expect, it } from 'vitest';
import { publishOfferTrip, publishTrip } from './application/publish';
import { setup } from './test-kit';

// Samarqand viloyati → Toshkent shahri: the test kit gives this direction no pitak.
const NO_PITAK = { from: '1718401', to: '1726273' };

describe('the checks of a new trip (G63, docs/06, docs/70)', () => {
  it('keeps «Mashinada ayol bor» only for a man with a free seat in the car, else drops it', async () => {
    const { deps, trip } = setup();
    const stored = async (driverId: number, seats: number) => {
      const published = await publishTrip(deps, driverId, { ...trip, seats, womanOnBoard: true });
      return (await deps.trips.find(published.ok ? published.value.id : ''))?.womanOnBoard;
    };
    expect(await stored(1, 3)).toBe(true);
    // A woman driver gives the mark by herself (docs/06 rule 1): the switch is not hers.
    expect(await stored(2, 3)).toBe(false);
  });

  // The car has 4 seats: all of them for people leaves no seat for the woman of the driver.
  it('drops the mark of a man who gives every seat of the car', async () => {
    const { deps, trip } = setup();
    const published = await publishTrip(deps, 1, { ...trip, seats: 4, womanOnBoard: true });
    expect(published.ok && published.value.woman).toBe(false);
  });

  it('refuses the pitak way where the direction has no pitak, the door way goes', async () => {
    const { deps, trip } = setup();
    for (const pickupMode of ['pitak', 'both'] as const)
      expect(await publishTrip(deps, 1, { ...trip, ...NO_PITAK, pickupMode })).toEqual({
        ok: false,
        error: 'trips.no_pitak',
      });
    const door = await publishTrip(deps, 1, { ...trip, ...NO_PITAK, pickupMode: 'door' });
    expect(door.ok && door.value).toMatchObject({ pickupMode: 'door', pitak: null });
  });

  it('gives the trip of an accepted offer both ways, or the door where there is no pitak', async () => {
    const { deps, trip } = setup();
    const both = await publishOfferTrip(deps, 1, trip);
    expect(both.ok && both.value.pickupMode).toBe('both');
    const door = await publishOfferTrip(deps, 2, { ...trip, ...NO_PITAK });
    expect(door.ok && door.value.pickupMode).toBe('door');
  });
});
