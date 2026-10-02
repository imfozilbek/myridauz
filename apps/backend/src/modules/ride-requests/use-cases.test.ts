import { describe, expect, it } from 'vitest';
import { cancelRequest, myRequests, publishRequest, searchRequests } from './application/use-cases';
import { FAR_NORTH, HOME, setup } from './requests-test-kit';

describe('ride requests (docs/09, docs/35)', () => {
  it('checks the day, the route, the price and keeps at most 3 open requests', async () => {
    const { deps, request } = setup();
    expect(await publishRequest(deps, 1, { ...request, date: '2026-09-30' })).toEqual({
      ok: false,
      error: 'trips.in_past',
    });
    expect(await publishRequest(deps, 1, { ...request, to: request.from })).toEqual({
      ok: false,
      error: 'locations.same_place',
    });
    expect(await publishRequest(deps, 1, { ...request, price: 700000 })).toEqual({
      ok: false,
      error: 'trips.price_out_of_bounds',
    });
    for (let index = 0; index < 3; index += 1) expect((await publishRequest(deps, 1, request)).ok).toBe(true);
    expect(await publishRequest(deps, 1, request)).toEqual({ ok: false, error: 'trips.too_many' });
  });

  it('checks the way and the points (G24, docs/70)', async () => {
    const { deps, request } = setup();
    const wrong = { ok: false, error: 'bookings.wrong_mode' };
    expect(await publishRequest(deps, 1, { ...request, pickup: null })).toEqual(wrong);
    const noPitak = { ...request, from: '1718401', to: '1726273', pickupMode: 'pitak' as const };
    expect(await publishRequest(deps, 1, noPitak)).toEqual(wrong);
    const outside = { ok: false, error: 'bookings.outside_area' };
    expect(await publishRequest(deps, 1, { ...request, dropoff: FAR_NORTH })).toEqual(outside);
    const byPitak = await publishRequest(deps, 1, { ...request, pickupMode: 'pitak', pickup: HOME });
    expect(byPitak.ok && byPitak.value.pickupMode).toBe('pitak');
    // A pitak request keeps no point at the door; a cancelled request keeps no points (docs/69).
    const [stored] = await deps.requests.byPassenger(1);
    expect(stored?.pickup).toBeNull();
    await cancelRequest(deps, 1, stored?.id ?? '');
    expect((await deps.requests.find(stored?.id ?? ''))?.dropoff).toBeNull();
  });

  it('lets only an approved driver find requests by place or region', async () => {
    const { deps, request } = setup();
    await publishRequest(deps, 1, request);
    const search = { from: '1726', to: '1718', date: '2026-10-01' };
    expect(await searchRequests(deps, 2, search)).toEqual({ ok: false, error: 'trips.not_driver' });
    const found = await searchRequests(deps, 9, search);
    expect(found.ok && found.value.map((item) => item.passenger.firstName)).toEqual(['P1']);
  });

  it('lets the passenger cancel and expires a request when its day is over', async () => {
    const { deps, request, setNow } = setup();
    const first = await publishRequest(deps, 1, request);
    await publishRequest(deps, 1, { ...request, date: '2026-10-02' });
    const firstId = first.ok ? first.value.id : '';
    expect(await cancelRequest(deps, 2, firstId)).toEqual({ ok: false, error: 'trips.not_found' });
    expect((await cancelRequest(deps, 1, firstId)).ok).toBe(true);
    setNow(Date.parse('2026-10-02T19:00:00Z'));
    await deps.requests.expireOver(Date.parse('2026-10-02T19:00:00Z'));
    expect((await myRequests(deps, 1)).map((item) => item.status).sort()).toEqual(['cancelled', 'expired']);
    expect(await cancelRequest(deps, 1, firstId)).toEqual({ ok: false, error: 'trips.wrong_status' });
  });
});
