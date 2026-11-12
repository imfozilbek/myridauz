import { describe, expect, it } from 'vitest';
import { requestDirections } from './application/request-directions';
import { publishRequest } from './application/use-cases';
import { setup } from './requests-test-kit';

// «Qayerga» of a driver (owner decision 12.11.2026, docs/118): the demand by region, today and tomorrow.
describe('the requests of each direction for a driver', () => {
  it('counts the open requests of today and tomorrow from the region of «Qayerdan»', async () => {
    const { deps, request } = setup();
    await publishRequest(deps, 1, request);
    await publishRequest(deps, 2, { ...request, date: '2026-10-02' });
    await publishRequest(deps, 3, { ...request, date: '2026-10-02' });
    // Later than tomorrow, or from another region: not this card.
    await publishRequest(deps, 4, { ...request, date: '2026-10-03' });
    await publishRequest(deps, 5, { ...request, from: '1718401', to: '1726273' });
    expect(await requestDirections(deps, 9, '1726')).toEqual([{ to: '1718', today: 1, tomorrow: 2 }]);
    // Any place of the region counts the same requests.
    expect(await requestDirections(deps, 9, '1726273')).toEqual([{ to: '1718', today: 1, tomorrow: 2 }]);
  });

  it('never the own request, nobody hidden by complaints', async () => {
    const { deps, request } = setup();
    await publishRequest(deps, 1, request);
    await publishRequest(deps, 2, request);
    await publishRequest(deps, 9, { ...request, date: '2026-10-02' });
    const hiding = { ...deps, hidden: async () => new Set([2]) };
    expect(await requestDirections(hiding, 9, '1726')).toEqual([{ to: '1718', today: 1, tomorrow: 0 }]);
  });

  it('shows every other region with no requests too, in the fixed order', async () => {
    const { deps } = setup();
    expect(await requestDirections(deps, 9, '1718401')).toEqual([{ to: '1726', today: 0, tomorrow: 0 }]);
  });
});
