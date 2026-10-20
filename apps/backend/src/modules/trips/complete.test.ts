import { describe, expect, it } from 'vitest';
import { completeOverTrips } from './application/progress';
import type { TripsDeps } from './application/ports';

// G89: the Cron marks every trip over as completed at once; one trip whose news failed keeps no
// other trip from its news, and the job still reports the failure for the dashboard.
describe('the trips that are over', () => {
  it('tells every completed trip even when one fails, then reports the failure', async () => {
    const told: string[] = [];
    const deps = {
      trips: { completeOver: async () => ['a', 'b'] },
      changed: async (id: string) => {
        if (id === 'a') throw new Error('bot down');
        told.push(id);
      },
    } as unknown as Pick<TripsDeps, 'trips' | 'changed'>;
    await expect(completeOverTrips(deps, 1)).rejects.toThrow('bot down');
    expect(told).toEqual(['b']);
  });
});
