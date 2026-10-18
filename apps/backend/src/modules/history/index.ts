import type { Bindings } from '../../env';
import { pastRidesOf } from '../bookings';
import { reviewStandingOf, starsOf } from '../ratings';
import { firstNames } from '../users';
import type { HistoryDeps } from './application/history';
import { historyRoutes } from './http/history-routes';

const historyDeps = (env: Bindings): HistoryDeps => ({
  rides: (userId, side) => pastRidesOf(env, userId, side),
  stars: (userId) => starsOf(env, userId),
  standing: (userId) => reviewStandingOf(env, userId),
  names: (ids) => firstNames(env, ids),
});

export const historyModule = historyRoutes(historyDeps);
