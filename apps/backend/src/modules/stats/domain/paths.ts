import {
  ARRIVAL_KINDS,
  PATH_ROLES,
  PATH_STEPS,
  TG_BUCKETS,
  TG_PLATFORMS,
  type Path,
  type PathRole,
  type PathStepId,
  type Paths,
  type TgBucket,
  type TgPlatform,
} from '@platform/contracts';
import { sourceOf } from './arrivals';

// G99 (docs/234): one step of one person, with their first touch and their Telegram.
export type PathRow = {
  readonly who: string;
  readonly entry: string | null;
  readonly tg: string | null;
  readonly platform: string | null;
  readonly role: PathRole;
  readonly step: PathStepId;
  readonly at: number;
};
// The refused requests and the crashes of a first touch and a Telegram.
export type ErrorCount = {
  readonly entry: string | null;
  readonly tg: string | null;
  readonly platform: string | null;
  readonly count: number;
};

const PERCENT = 100;
const FIRST_V7 = 7;
const FIRST_V8 = 8;

// «6.9» is old, «7.10» is 7.x, «8.0» and later are new; an app that did not say it has none.
export function tgBucketOf(tg: string | null): TgBucket {
  const major = Number.parseInt(tg ?? '', 10);
  if (!Number.isFinite(major) || major <= 0) return 'none';
  return major < FIRST_V7 ? 'old' : major < FIRST_V8 ? 'v7' : 'v8';
}
export function tgPlatformOf(platform: string | null): TgPlatform {
  if (!platform) return 'unknown';
  if (platform === 'android_x') return 'android';
  return (TG_PLATFORMS as readonly string[]).includes(platform) ? (platform as TgPlatform) : 'other';
}
const kindOf = (entry: string | null) => sourceOf(entry).kind;

const dropOf = (previous: number, current: number) =>
  previous === 0 ? 0 : Math.max(0, Math.round(((previous - current) / previous) * PERCENT));

// The people of each step of each role: a person counts once on a step, whatever they did again.
function pathsOf(rows: readonly PathRow[]): Path[] {
  return PATH_ROLES.map((role) => {
    const steps: readonly PathStepId[] = PATH_STEPS[role];
    const counts = steps.map(
      (step) =>
        new Set(rows.filter((row) => row.role === role && row.step === step).map((row) => row.who)).size,
    );
    return {
      role,
      steps: steps.map((step, index) => ({
        step,
        count: counts[index] ?? 0,
        drop: index === 0 ? null : dropOf(counts[index - 1] ?? 0, counts[index] ?? 0),
      })),
    };
  });
}

function slices<K extends string>(
  keys: readonly K[],
  rows: readonly PathRow[],
  errors: readonly ErrorCount[],
  keyOf: (row: { entry: string | null; tg: string | null; platform: string | null }) => K,
) {
  return keys
    .map((key) => {
      const mine = rows.filter((row) => keyOf(row) === key);
      const failed = errors.filter((row) => keyOf(row) === key).reduce((sum, row) => sum + row.count, 0);
      return { key, people: new Set(mine.map((row) => row.who)).size, errors: failed, paths: pathsOf(mine) };
    })
    .filter((slice) => slice.people > 0 || slice.errors > 0);
}

// «Yoʻl manbalari» and «Telegram versiyalari» of a period (T2 … T5).
export function pathsReport(
  rows: readonly PathRow[],
  errors: readonly ErrorCount[],
): Pick<Paths, 'sources' | 'versions' | 'platforms'> {
  return {
    sources: slices(ARRIVAL_KINDS, rows, errors, (row) => kindOf(row.entry)).map(({ key, ...rest }) => ({
      kind: key,
      ...rest,
    })),
    versions: slices(TG_BUCKETS, rows, errors, (row) => tgBucketOf(row.tg)).map(({ key, ...rest }) => ({
      tg: key,
      ...rest,
    })),
    platforms: slices(TG_PLATFORMS, rows, errors, (row) => tgPlatformOf(row.platform)).map(
      ({ key, ...rest }) => ({ platform: key, ...rest }),
    ),
  };
}
