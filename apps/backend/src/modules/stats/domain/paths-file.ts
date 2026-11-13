import { PATH_ROLES, PATH_STEPS } from '@platform/contracts';
import { sourceOf } from './arrivals';
import { tgBucketOf, tgPlatformOf, type ErrorCount, type PathRow } from './paths';

// G99 T6 (docs/234): the files for the analyst. One row a person: the public id (before the
// registration the id of a session), the first touch, the Telegram and the first moment of each step,
// UTC. Never a phone, a name or a Telegram ID (docs/29, docs/30).
const STEP_COLUMNS = PATH_ROLES.flatMap((role) => PATH_STEPS[role].map((step) => `${role}_${step}`));
const PERSON_COLUMNS = [
  'person',
  'source',
  'mark',
  'telegram',
  'telegram_group',
  'platform',
  ...STEP_COLUMNS,
];
const ERROR_COLUMNS = ['source', 'mark', 'telegram', 'telegram_group', 'platform', 'errors'];

// A cell in quotes when it holds a comma, a quote or a line break (RFC 4180).
const cell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const line = (values: readonly (string | number)[]) => values.map(cell).join(',');
const timeOf = (at: number | undefined) => (at === undefined ? '' : new Date(at).toISOString());
const telegramOf = (row: { entry: string | null; tg: string | null; platform: string | null }) => [
  sourceOf(row.entry).kind,
  row.entry ?? '',
  row.tg ?? '',
  tgBucketOf(row.tg),
  tgPlatformOf(row.platform),
];

export function peopleFile(rows: readonly PathRow[]): string {
  const people = new Map<string, PathRow[]>();
  for (const row of rows) people.set(row.who, [...(people.get(row.who) ?? []), row]);
  const lines = [...people].map(([who, mine]) => {
    const first = new Map<string, number>();
    for (const row of mine) {
      const key = `${row.role}_${row.step}`;
      first.set(key, Math.min(first.get(key) ?? row.at, row.at));
    }
    const known = mine.find((row) => row.entry !== null) ?? mine[0];
    return line([
      who,
      ...(known ? telegramOf(known) : []),
      ...STEP_COLUMNS.map((column) => timeOf(first.get(column))),
    ]);
  });
  return [line(PERSON_COLUMNS), ...lines].join('\n');
}

export const errorsFile = (errors: readonly ErrorCount[]): string =>
  [line(ERROR_COLUMNS), ...errors.map((row) => line([...telegramOf(row), row.count]))].join('\n');
