import { describe, expect, it } from 'vitest';
import { publishRequest, searchRequests } from './application/use-cases';
import { setup } from './requests-test-kit';

const SEARCH = { from: '1726', to: '1718', date: '2026-10-01' };
const names = async (found: Awaited<ReturnType<typeof searchRequests>>) =>
  found.ok ? found.value.map((item) => item.passenger.firstName) : [];

// A driver sees only the requests the car can take and the people the search shows (docs/90).
describe('the requests a driver finds', () => {
  it('leaves out a request for more seats than the car has (F-D2)', async () => {
    const { deps, request } = setup();
    await publishRequest(deps, 1, request);
    await publishRequest(deps, 2, { ...request, seats: 5 });
    expect(await names(await searchRequests(deps, 9, SEARCH))).toEqual(['P1']);
  });

  it('hides a person hidden by complaints, as the search of trips does (F-D8)', async () => {
    const { deps, request } = setup();
    await publishRequest(deps, 1, request);
    await publishRequest(deps, 2, request);
    const hiding = { ...deps, hidden: async () => new Set([2]) };
    expect(await names(await searchRequests(hiding, 9, SEARCH))).toEqual(['P1']);
  });
});
