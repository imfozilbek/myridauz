import {
  ADMIN_PATHS_FILE_PATH,
  ADMIN_PATHS_PATH,
  ADMIN_ROST_PATH,
  ADMIN_STATS_PATH,
  pathsSchema,
  rostSchema,
  type Paths,
  statsSchema,
  type Rost,
  type RostPeriod,
  type Stats,
  type StatsPeriod,
} from '@platform/contracts';
import { signedRequest, type SignedOptions } from './signed-request';

// The dashboard of the team (docs/29, G12).
export function createStatsClient(options: SignedOptions) {
  const { request, post } = signedRequest(options);
  return {
    get: async (period: StatsPeriod): Promise<Stats> =>
      statsSchema.parse(await (await request(`${ADMIN_STATS_PATH}?period=${period}`)).json()),
    // «Rost» (G69, docs/123): the loops of growth and the directions.
    rost: async (period: RostPeriod): Promise<Rost> =>
      rostSchema.parse(await (await request(`${ADMIN_ROST_PATH}?period=${period}`)).json()),
    // G99 (docs/234): the paths by source, version of Telegram and platform; the files of the analyst.
    paths: async (period: StatsPeriod): Promise<Paths> =>
      pathsSchema.parse(await (await request(`${ADMIN_PATHS_PATH}?period=${period}`)).json()),
    pathsFile: async (period: StatsPeriod): Promise<void> =>
      void (await post(`${ADMIN_PATHS_FILE_PATH}?period=${period}`, {})),
  };
}

export type StatsClient = ReturnType<typeof createStatsClient>;
