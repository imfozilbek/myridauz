import type { Bindings } from '../../env';
import { pastRidesOf } from '../bookings';
import { reviewStandingOf, starsOf } from '../ratings';
import { peopleOf } from '../users';
import type { HistoryDeps } from './application/history';
import { historyRoutes } from './http/history-routes';

const historyDeps = (env: Bindings): HistoryDeps => ({
  rides: (userId, side) => pastRidesOf(env, userId, side),
  stars: (userId) => starsOf(env, userId),
  standing: (userId) => reviewStandingOf(env, userId),
  names: async (ids) => {
    const people = peopleOf(env);
    const found = await Promise.all(
      ids.map(async (id) => [id, (await people.find(id))?.firstName ?? ''] as const),
    );
    return new Map(found);
  },
});

export const historyModule = historyRoutes(historyDeps);
