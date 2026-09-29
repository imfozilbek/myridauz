import { ADMIN_STATS_PATH, statsSchema, type Stats, type StatsPeriod } from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The dashboard of the team (docs/29, G12).
export function createStatsClient(options: SignedOptions) {
  const { request } = signedRequest(options);
  return {
    get: async (period: StatsPeriod): Promise<Stats> =>
      statsSchema.parse(await (await request(`${ADMIN_STATS_PATH}?period=${period}`)).json()),
  };
}

export type StatsClient = ReturnType<typeof createStatsClient>;
