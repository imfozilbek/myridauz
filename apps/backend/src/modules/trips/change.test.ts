import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { lowerTripPrice, retimeTrip } from './application/change';
import { publishTrip } from './application/publish';
import { HOUR, NOW, setup } from './test-kit';

const MINUTE = HOUR / 60;
const BACK = { from: '1718401', to: '1726273' };

async function published(later = 0) {
  const kit = setup();
  const made = await publishTrip(kit.deps, 1, { ...kit.trip, departAt: kit.trip.departAt + later });
  return { ...kit, id: made.ok ? made.value.id : '' };
}

describe('a driver moves the time later (G39, docs/104, 8)', () => {
  it('moves it, keeps the first time and tells the people with a booking', async () => {
    const { deps, trip, id, events } = await published();
    const moved = await retimeTrip(deps, 1, id, trip.departAt + 30 * MINUTE);
    expect(moved).toMatchObject({
      ok: true,
      value: { departAt: trip.departAt + 30 * MINUTE, firstDepartAt: trip.departAt },
    });
    expect(events).toContain(`retimed ${id}`);
    expect(await retimeTrip(deps, 1, id, trip.departAt + 2 * HOUR)).toEqual({
      ok: false,
      error: 'trips.invalid_input',
    });
    expect(await retimeTrip(deps, 2, id, trip.departAt + 40 * MINUTE)).toEqual({
      ok: false,
      error: 'trips.not_found',
    });
  });

  it('refuses a time the driver cannot make before the next trip (docs/103)', async () => {
    const { deps, trip, id } = await published();
    // The way back leaves at the earliest: arrival after 5 hours and 2.5 hours to gather people.
    await publishTrip(deps, 1, { ...trip, ...BACK, departAt: trip.departAt + 7.5 * HOUR });
    expect(await retimeTrip(deps, 1, id, trip.departAt + 30 * MINUTE)).toEqual({
      ok: false,
      error: 'trips.busy',
    });
  });
});

describe('a driver lowers the price (G39, docs/104, 9)', () => {
  it('lowers it within the bound and tells about it once a day', async () => {
    // The trip leaves in two days: a day later it has not left yet.
    const { deps, id, events, setNow } = await published(2 * DAY_MS);
    expect(await lowerTripPrice(deps, 1, id, 80000)).toMatchObject({
      ok: true,
      value: { price: 80000, firstPrice: 90000 },
    });
    expect(events).toContain(`cheaper ${id}`);
    await lowerTripPrice(deps, 1, id, 75000);
    // The same day: the channel post changes, nobody is told again.
    expect(events.at(-1)).toBe(`updated ${id}`);
    setNow(NOW + DAY_MS);
    await lowerTripPrice(deps, 1, id, 70000);
    expect(events.at(-1)).toBe(`cheaper ${id}`);
  });

  it('refuses a higher price and a price below the bound', async () => {
    const { deps, id } = await published();
    expect(await lowerTripPrice(deps, 1, id, 95000)).toEqual({ ok: false, error: 'trips.invalid_input' });
    expect(await lowerTripPrice(deps, 1, id, 20000)).toEqual({
      ok: false,
      error: 'trips.price_out_of_bounds',
    });
  });
});
