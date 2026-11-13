import { eventDaysOf, periodSince, type Paths, type StatsPeriod } from '@platform/contracts';
import { eventRows, serverRows } from '../domain/path-events';
import { pathsReport, type ErrorCount, type PathRow } from '../domain/paths';
import type { StatsDeps } from './ports';
import { cached } from './read-stats';

// G99 (docs/234): the steps of every person of a period, from the events and from the tables, and
// the errors by first touch and Telegram. Without the analytics key: the steps of the tables only.
export async function pathRowsOf(
  deps: StatsDeps,
  period: StatsPeriod,
): Promise<{ events: Paths['events']; rows: PathRow[]; errors: ErrorCount[] }> {
  const days = eventDaysOf(period);
  const server = serverRows(await deps.numbers.pathSteps(periodSince(period, deps.now())));
  if (!deps.events) return { events: 'off', rows: server, errors: [] };
  const found = await Promise.all([deps.events.pathEvents(days), deps.events.pathErrors(days)]).catch(
    () => null,
  );
  if (!found) return { events: 'failed', rows: server, errors: [] };
  return { events: 'on', rows: [...eventRows(found[0]), ...server], errors: found[1] };
}

// «Yoʻl manbalari» and «Telegram versiyalari», kept 10 minutes like the dashboard (docs/56).
export const readPaths = (deps: StatsDeps, period: StatsPeriod): Promise<Paths> =>
  cached(deps.cache, `paths:${period}`, deps.now(), async () => {
    const { events, rows, errors } = await pathRowsOf(deps, period);
    return { period, events, ...pathsReport(rows, errors), at: deps.now() };
  });
