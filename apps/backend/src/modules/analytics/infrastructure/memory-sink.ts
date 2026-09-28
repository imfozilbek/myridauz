import type { AnalyticsSink } from '../application/analytics-sink';
import type { DataPoint } from '../domain/data-point';

// Local fake of Analytics Engine: keeps the last rows in memory (docs/29).
const MAX_ROWS = 1000;

export function createMemorySink() {
  const rows: DataPoint[] = [];
  const sink: AnalyticsSink = {
    write: (point) => {
      rows.push(point);
      if (rows.length > MAX_ROWS) rows.shift();
    },
  };
  return { sink, rows };
}
