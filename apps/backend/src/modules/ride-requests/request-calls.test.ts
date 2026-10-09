import { describe, expect, it } from 'vitest';
import { setRequestCalls } from './application/calls';
import { myRequests, publishRequest, searchRequests } from './application/use-cases';
import { setup } from './requests-test-kit';

const SEARCH = { from: '1726', to: '1718', date: '2026-10-01' };

// Calls about a request before a booking (G64, docs/118 path 7, docs/127): drivers may call unless
// the passenger turned it off; drivers see the passenger's rating on the card.
describe('the calls and the rating of a request (G64)', () => {
  it('lets drivers call by default and the passenger turns it off and on again', async () => {
    const { deps, request } = setup();
    const published = await publishRequest(deps, 1, request);
    if (!published.ok) throw new Error(published.error);
    expect(published.value.callsOff).toBe(false);
    const off = await setRequestCalls(deps, 1, published.value.id, false);
    expect(off.ok && off.value.callsOff).toBe(true);
    expect((await myRequests(deps, 1))[0]?.callsOff).toBe(true);
    const on = await setRequestCalls(deps, 1, published.value.id, true);
    expect(on.ok && on.value.callsOff).toBe(false);
  });

  it('refuses the switch to anybody but the passenger, and on a request that is over', async () => {
    const { deps, request, setNow } = setup();
    const published = await publishRequest(deps, 1, request);
    if (!published.ok) throw new Error(published.error);
    expect(await setRequestCalls(deps, 2, published.value.id, false)).toEqual({
      ok: false,
      error: 'trips.not_found',
    });
    setNow(Date.parse('2026-10-02T01:00:00Z'));
    expect(await setRequestCalls(deps, 1, published.value.id, false)).toEqual({
      ok: false,
      error: 'trips.wrong_status',
    });
  });

  it('shows the passenger rating to drivers', async () => {
    const { deps, request } = setup();
    await publishRequest(deps, 1, request);
    const found = await searchRequests(deps, 9, SEARCH);
    expect(found.ok && found.value[0]?.passenger.rating).toEqual({ average: 4.8, count: 12 });
  });
});
