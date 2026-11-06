import { describe, expect, it } from 'vitest';
import { fixLiveCar } from './application/fix-car';
import { publishTrip } from './application/publish';
import { HOUR, NOW, setup } from './test-kit';

// G95 (docs/224): the car the team fixed by its photo reaches the live trips of the driver.
const SEEN = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A777BC', seats: 4 } as const;

async function published() {
  const kit = setup();
  const trip = await publishTrip(kit.deps, 1, kit.trip);
  return { ...kit, id: trip.ok ? trip.value.id : '' };
}

describe('the fixed car in the trips of the driver', () => {
  it('goes to a live trip; its posts and the card of the driver follow', async () => {
    const { deps, events, id } = await published();
    await fixLiveCar(deps, 1, SEEN);
    expect((await deps.trips.find(id))?.car).toEqual({
      make: 'Chevrolet',
      model: 'Cobalt',
      color: 'white',
      plate: '01A777BC',
    });
    expect(events).toContain(`updated ${id}`);
  });

  it('never reaches a trip on the way: the people met the car already', async () => {
    const { deps, events, id, setNow } = await published();
    setNow(NOW + 3 * HOUR);
    await deps.trips.depart(id, NOW + 3 * HOUR);
    await fixLiveCar(deps, 1, SEEN);
    expect((await deps.trips.find(id))?.car?.plate).toBe('01A123BC');
    expect(events).not.toContain(`updated ${id}`);
  });

  it('never changes a past trip', async () => {
    const { deps, id, setNow } = await published();
    setNow(NOW + 30 * HOUR);
    await fixLiveCar(deps, 1, SEEN);
    expect((await deps.trips.find(id))?.car?.plate).toBe('01A123BC');
  });

  it('leaves the trips of another driver', async () => {
    const { deps, id } = await published();
    await fixLiveCar(deps, 2, SEEN);
    expect((await deps.trips.find(id))?.car?.plate).toBe('01A123BC');
  });
});
