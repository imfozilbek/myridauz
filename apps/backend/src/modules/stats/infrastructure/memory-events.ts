import type { ErrorRow } from '@platform/contracts';
import type { DataPoint } from '../../analytics';
import { ERROR_EVENTS, type EventSource } from '../application/ports';
import type { Counter } from '../domain/counters';
import { toErrorRow } from './sql-rows';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const TOP_ERRORS = 10;

// Locally the rows of the memory sink answer the same questions as Analytics Engine (docs/29).
export function memoryEvents(rows: readonly DataPoint[], now: () => number): EventSource {
  const recent = (ms: number) => rows.filter((row) => (row.doubles[1] ?? 0) > now() - ms);
  const isError = (row: DataPoint) => (ERROR_EVENTS as readonly string[]).includes(row.blobs[0] ?? '');
  const group = <T>(
    list: readonly DataPoint[],
    keyOf: (row: DataPoint) => string,
    make: (rows: DataPoint[]) => T,
  ) => {
    const groups = new Map<string, DataPoint[]>();
    for (const row of list) groups.set(keyOf(row), [...(groups.get(keyOf(row)) ?? []), row]);
    return [...groups.values()].map(make);
  };
  return {
    counters: async (days, names) =>
      group(
        recent(days * DAY).filter((row) => names.includes(row.blobs[0] ?? '')),
        ({ blobs }) => [blobs[0], blobs[1], blobs[5]].join('|'),
        (same): Counter => ({
          name: same[0]?.blobs[0] ?? '',
          app: same[0]?.blobs[1] ?? '',
          code: same[0]?.blobs[5] ?? '',
          sessions: new Set(same.map((row) => row.blobs[4])).size,
          events: same.length,
        }),
      ),
    topErrors: async (days) =>
      group(
        recent(days * DAY).filter(isError),
        ({ blobs }) => [blobs[0], blobs[1], blobs[2], blobs[5], blobs[6], blobs[7]].join('|'),
        (same): ErrorRow =>
          toErrorRow({
            name: same[0]?.blobs[0] ?? '',
            app: same[0]?.blobs[1] ?? '',
            screen: same[0]?.blobs[2] ?? '',
            code: same[0]?.blobs[5] ?? '',
            error: same[0]?.blobs[6] ?? '',
            detail: same[0]?.blobs[7] ?? '',
            count: same.length,
          }),
      )
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_ERRORS),
    errorsSince: async (hours) => recent(hours * HOUR).filter(isError).length,
  };
}
