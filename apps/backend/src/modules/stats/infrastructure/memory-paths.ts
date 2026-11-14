import { DAY_MS } from '@platform/contracts';
import type { DataPoint } from '../../analytics';
import { NETWORK_CODES, type EventSource } from '../application/ports';
import { PATH_EVENTS, type PathEvent } from '../domain/path-events';

// Locally the rows of the memory sink answer the questions of the paths (G99, docs/234), as
// analytics-paths.ts asks Analytics Engine: blob12 … blob15 are blobs[11] … blobs[14].
const WHO = 11;
const at = (index: number) => (row: DataPoint) => row.blobs[index] ?? '';
const [who, entry, tg, platform] = [WHO, WHO + 1, WHO + 2, WHO + 3].map(at) as [
  (row: DataPoint) => string,
  (row: DataPoint) => string,
  (row: DataPoint) => string,
  (row: DataPoint) => string,
];

export function memoryPaths(
  rows: readonly DataPoint[],
  now: () => number,
): Pick<EventSource, 'pathEvents' | 'pathErrors'> {
  const recent = (days: number) => rows.filter((row) => (row.doubles[1] ?? 0) > now() - days * DAY_MS);
  return {
    pathEvents: async (days) => {
      const first = new Map<string, PathEvent>();
      for (const row of recent(days)) {
        if (!(PATH_EVENTS as readonly string[]).includes(row.blobs[0] ?? '') || !who(row)) continue;
        const event = {
          who: who(row),
          entry: entry(row),
          tg: tg(row),
          platform: platform(row),
          name: row.blobs[0] ?? '',
          app: row.blobs[1] ?? '',
          code: row.blobs[5] ?? '',
          at: row.doubles[0] ?? 0,
        };
        const key = [
          event.who,
          event.entry,
          event.tg,
          event.platform,
          event.name,
          event.app,
          event.code,
        ].join('|');
        const kept = first.get(key);
        if (!kept || kept.at > event.at) first.set(key, event);
      }
      return [...first.values()];
    },
    pathErrors: async (days) =>
      recent(days)
        .filter(
          (row) =>
            (row.blobs[0] === 'client_error' || row.blobs[0] === 'api_error') &&
            who(row) !== '' &&
            !(NETWORK_CODES as readonly string[]).includes(row.blobs[5] ?? ''),
        )
        .map((row) => ({
          entry: entry(row) || null,
          tg: tg(row) || null,
          platform: platform(row) || null,
          count: 1,
        })),
  };
}
