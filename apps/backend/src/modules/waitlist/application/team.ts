import {
  ROLE_CADENCES,
  ROLE_PAINS,
  type Opening,
  type WaitlistDirection,
  type WaitlistOverview,
  type WaitlistRole,
} from '@platform/contracts';
import { directionsOf, shareOf, topPainOf } from '../domain/gold';
import { WEEK_MS } from '../domain/waiting';
import { tellOpened, type BotJobDeps } from './bot-jobs';
import type { PainCounts, SideRow, TeamReads } from './ports';

export type TeamDeps = BotJobDeps & {
  readonly reads: TeamReads;
  // How many of these drivers the team approved (docs/04).
  readonly approved: (driverIds: readonly number[]) => Promise<number>;
  readonly journal: (by: number, subject: string, action: string) => Promise<void>;
  // An answer kept 10 minutes, like the dashboard (docs/56): the «gold» of the statistics.
  readonly cached: <T>(key: string, load: () => Promise<T>) => Promise<T>;
};
// The first people hear an opening at once; the rest in the next Cron runs.
const FIRST_TELLS = 50;

// «Kutayotganlar» of «Statistika» (docs/181): everyone, the directions, the main pain of passengers.
export async function overview(deps: TeamDeps): Promise<WaitlistOverview> {
  const [rows, openings, pains] = await Promise.all([
    deps.reads.regions(),
    deps.openings.all(),
    deps.reads.pains('passenger', null),
  ]);
  const directions = directionsOf(rows).map((row) => ({ ...row, opened: openings.get(row.region) ?? null }));
  const sum = (key: 'passengers' | 'drivers') => directions.reduce((total, row) => total + row[key], 0);
  return { passengers: sum('passengers'), drivers: sum('drivers'), directions, topPain: topPainOf(pains) };
}

function sideOf(role: WaitlistRole, rows: readonly SideRow[], pains: PainCounts) {
  const own = rows.filter((row) => row.role === role);
  const count = own.reduce((total, row) => total + row.count, 0);
  const cadences = ROLE_CADENCES[role].map((cadence) => ({
    cadence,
    count: own.find((row) => row.cadence === cadence)?.count ?? 0,
  }));
  const shares = ROLE_PAINS[role].map((pain) => ({
    pain,
    count: pains[pain],
    share: shareOf(pains[pain], count),
  }));
  return { count, cadences, pains: shares.sort((a, b) => b.count - a.count) };
}

// One direction: who waits and how often, what hurts them, how many drivers are approved (docs/181).
export async function direction(deps: TeamDeps, region: string): Promise<WaitlistDirection> {
  const [rows, since, opened, passengerPains, driverPains, driverIds] = await Promise.all([
    deps.reads.sides(region),
    deps.reads.since(region),
    deps.openings.of(region),
    deps.reads.pains('passenger', region),
    deps.reads.pains('driver', region),
    deps.reads.drivers(region),
  ]);
  return {
    region,
    since,
    passengers: sideOf('passenger', rows, passengerPains),
    drivers: { ...sideOf('driver', rows, driverPains), approved: await deps.approved(driverIds) },
    opened,
  };
}

// «Ochish» (docs/181): the direction opens once; the bot tells everyone who waits on it once.
export async function openDirection(deps: TeamDeps, region: string, by: number): Promise<Opening> {
  const opened = await deps.openings.of(region);
  if (opened) return opened;
  const now = deps.now();
  const sent = await deps.reads.toTell(region, now - WEEK_MS);
  await deps.openings.open(region, by, sent, now);
  await deps.journal(by, region, 'open');
  await tellOpened(deps, FIRST_TELLS);
  return { at: now, sent };
}
