import { describe, expect, it } from 'vitest';
import { fileComplaint, hiddenFromSearch } from './application/file';
import { complaintQueue } from './application/moderate';
import { DRIVER, input, setup } from './complaints-test-kit';

// A ride the team cannot open any more (its booking or trip is gone): the complaint is out of the
// queue, so it must not hide the person either; nobody could ever decide it (docs/90 F-A1).
describe('a complaint whose ride is gone', () => {
  it('neither shows in the queue nor hides the person from search', async () => {
    const { deps } = setup();
    for (const n of [1, 2, 3]) await fileComplaint(deps, 100 + n, input(`b${n}`));
    expect(await hiddenFromSearch(deps, [DRIVER])).toEqual(new Set([DRIVER]));
    const lost = { ...deps, filedRide: async (id: string) => (id === 'b3' ? undefined : deps.filedRide(id)) };
    expect(await complaintQueue(lost)).toHaveLength(2);
    expect(await hiddenFromSearch(lost, [DRIVER])).toEqual(new Set());
  });
});
