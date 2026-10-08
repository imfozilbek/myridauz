import { describe, expect, it } from 'vitest';
import { openTrip, publishPrivateTrip, releaseTrip } from './application/private-trip';
import { myTrips, searchTrips, tripDetail } from './application/read';
import { setup } from './test-kit';

const SEARCH = { from: '1726', to: '1718', date: '2026-10-01' };
const salon = { bookingRule: 'car_only' as const, seats: 4 };

// «Safar ochib taklif qilish» (G64, docs/118 path 7): a trip for the whole car of one request, seen
// only by that passenger until the answer; then the driver opens it for everybody or cancels it.
describe('a trip opened for one request (G64)', () => {
  it('is the driver’s, out of the search, the channels and the trip page of other people', async () => {
    const { deps, trip, events } = setup();
    const published = await publishPrivateTrip(deps, 1, { ...trip, ...salon }, 'request-1');
    if (!published.ok) throw new Error(published.error);
    expect(published.value.private).toBe(true);
    expect(events).toEqual([]);
    expect(await searchTrips(deps, SEARCH, 3)).toEqual([]);
    expect(await tripDetail(deps, published.value.id, 3)).toBeUndefined();
    expect((await tripDetail(deps, published.value.id, 1))?.id).toBe(published.value.id);
    expect((await myTrips(deps, 1)).map((item) => item.private)).toEqual([true]);
  });

  it('opens for everybody at the driver’s word: in the search and announced', async () => {
    const { deps, trip, events } = setup();
    const published = await publishPrivateTrip(deps, 1, { ...trip, ...salon }, 'request-1');
    const id = published.ok ? published.value.id : '';
    expect(await openTrip(deps, 2, id)).toEqual({ ok: false, error: 'trips.not_found' });
    const opened = await openTrip(deps, 1, id);
    expect(opened.ok && opened.value.private).toBe(false);
    expect(events).toEqual([`published ${id}`]);
    expect((await searchTrips(deps, SEARCH, 3)).map((item) => item.id)).toEqual([id]);
    expect(await openTrip(deps, 1, id)).toEqual({ ok: false, error: 'trips.wrong_status' });
  });

  it('becomes an ordinary trip without an announcement once the passenger takes it', async () => {
    const { deps, trip, events } = setup();
    const published = await publishPrivateTrip(deps, 1, { ...trip, ...salon }, 'request-1');
    const id = published.ok ? published.value.id : '';
    await releaseTrip(deps, id);
    expect((await tripDetail(deps, id, 3))?.private).toBe(false);
    expect(events).toEqual([]);
  });
});
