import type { Car } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import type { RequestsDeps } from './application/ports';
import { cancelRequest, myRequests, publishRequest, searchRequests } from './application/use-cases';
import { createMemoryRequests } from './infrastructure/memory-requests';

// 2026-10-01 06:00 in Tashkent.
const NOW = Date.parse('2026-10-01T01:00:00Z');
const CAR: Car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 };
const PLACES = new Map(
  [
    { id: '1726', parentId: null, oneCity: true },
    { id: '1726273', parentId: '1726', oneCity: false },
    { id: '1718', parentId: null, oneCity: false },
    { id: '1718401', parentId: '1718', oneCity: false },
  ].map((place) => [place.id, place]),
);

function setup() {
  let now = NOW;
  let id = 0;
  const deps: RequestsDeps = {
    requests: createMemoryRequests(),
    people: {
      find: async (userId) => ({ id: userId, firstName: `P${userId}`, avatarKey: null, gender: 'female' }),
    },
    approvedCar: async (userId) => (userId === 9 ? CAR : null),
    recommend: async (from, to) =>
      from === to
        ? { ok: false, error: 'locations.same_place' }
        : {
            ok: true,
            value: {
              from,
              to,
              km: 300,
              price: 90000,
              source: 'formula',
              minPrice: 30000,
              maxPrice: 600000,
              roundStep: 5000,
            },
          },
    places: async () => PLACES,
    newId: () => `request-${(id += 1)}`,
    now: () => now,
  };
  const request = { from: '1726273', to: '1718401', date: '2026-10-01', seats: 1, price: 90000 };
  return { deps, request, setNow: (next: number) => void (now = next) };
}

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
