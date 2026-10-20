import { describe, expect, it } from 'vitest';
import { offerSalonTrip, openSalonTrip } from './application/salon-trip';
import { DRIVER, HOUR, NOW, setup } from './test-kit';

const ON_THE_DAY = NOW + 26 * HOUR;
const refused = (error: string) => ({ ok: false, error });

// G89: every «no» of «Safar ochib taklif qilish» (G64): the driver reads why, and a trip whose offer
// could not go is cancelled at once, no hidden trip stays behind.
describe('a whole car trip that cannot be offered', () => {
  it('says why: no approved car, a closed or own request, too many seats, no money', async () => {
    const kit = setup();
    const salon = (extra = {}) => kit.addRequest({ wholeCar: true, ...extra });
    expect(await offerSalonTrip(kit.deps, DRIVER, salon({ passengerId: DRIVER }), ON_THE_DAY)).toEqual(
      refused('bookings.own_trip'),
    );
    expect(await offerSalonTrip(kit.deps, DRIVER, salon({ seats: 5 }), ON_THE_DAY)).toEqual(
      refused('bookings.no_seats'),
    );
    expect(await offerSalonTrip(kit.deps, DRIVER, salon(), ON_THE_DAY)).toEqual(refused('wallet.not_enough'));
    const closed = salon();
    kit.close(closed);
    expect(await offerSalonTrip(kit.deps, DRIVER, closed, ON_THE_DAY)).toEqual(refused('bookings.not_found'));
    kit.recheck();
    expect(await offerSalonTrip(kit.deps, DRIVER, salon(), ON_THE_DAY)).toEqual(refused('trips.not_driver'));
  });

  it('passes a known refusal of the trip and hides any other one', async () => {
    const kit = setup();
    await kit.bonus();
    const failing = (error: string) => ({
      ...kit.deps,
      trips: { ...kit.deps.trips, publishPrivate: async () => ({ ok: false as const, error }) },
    });
    const salon = kit.addRequest({ wholeCar: true });
    expect(await offerSalonTrip(failing('trips.too_soon'), DRIVER, salon, ON_THE_DAY)).toEqual(
      refused('trips.too_soon'),
    );
    expect(await offerSalonTrip(failing('trips.not_driver'), DRIVER, salon, ON_THE_DAY)).toEqual(
      refused('bookings.wrong_status'),
    );
  });

  it('cancels the new trip when its offer cannot go', async () => {
    const kit = setup();
    await kit.bonus();
    let checks = 0;
    // The money was there for the trip and was gone a moment later, for the offer.
    const wallet = { ...kit.deps.wallet, canAfford: async () => (checks += 1) === 1 };
    const sent = await offerSalonTrip(
      { ...kit.deps, wallet },
      DRIVER,
      kit.addRequest({ wholeCar: true }),
      ON_THE_DAY,
    );
    expect(sent).toEqual(refused('wallet.not_enough'));
    expect(kit.notes.filter((note) => note.startsWith('trip cancelled'))).toHaveLength(1);
  });

  it('opens no trip it does not know', async () => {
    const { deps } = setup();
    expect(await openSalonTrip(deps, DRIVER, 'none')).toEqual(refused('trips.not_found'));
  });
});
