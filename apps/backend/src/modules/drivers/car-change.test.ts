import { describe, expect, it } from 'vitest';
import { myApplication, submitApplication, uploadCarPhoto } from './application/apply';
import { decideApplication } from './application/moderate';
import { CAR, jpeg, setup } from './test-kit';

// One car at the launch, changed only without live trips (G75, docs/124 Ё, docs/158 Ё): the
// passengers of a trip wait for the car they booked, the driver stays a driver.
describe('a new car of an approved driver', () => {
  it('waits until the live trips are over', async () => {
    const { deps, drivers, photos, onTrip } = setup();
    await photos();
    await submitApplication(deps, 1, CAR);
    await decideApplication(deps, 900, 1, { action: 'approve' });
    onTrip();
    expect(await uploadCarPhoto(deps, 1, 'side', jpeg)).toEqual({ ok: false, error: 'drivers.live_trips' });
    expect(await submitApplication(deps, 1, { ...CAR, model: 'Nexia' })).toEqual({
      ok: false,
      error: 'drivers.live_trips',
    });
    expect((await myApplication(deps, 1))?.status).toBe('approved');
    expect(drivers.has(1)).toBe(true);
  });
});
