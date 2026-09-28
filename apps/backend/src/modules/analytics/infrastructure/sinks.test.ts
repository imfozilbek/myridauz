import { describe, expect, it } from 'vitest';
import type { DataPoint } from '../domain/data-point';
import { analyticsEngineSink } from './analytics-engine-sink';
import { createMemorySink } from './memory-sink';

const point: DataPoint = { indexes: ['admin'], blobs: ['screen_open'], doubles: [1] };

describe('analytics sinks', () => {
  it('writes to Analytics Engine', () => {
    const written: unknown[] = [];
    analyticsEngineSink({ writeDataPoint: (row) => written.push(row) }).write(point);
    expect(written).toEqual([point]);
  });

  it('keeps only the last rows in memory', () => {
    const { sink, rows } = createMemorySink();
    for (let i = 0; i < 1001; i += 1) sink.write({ ...point, doubles: [i] });
    expect(rows).toHaveLength(1000);
    expect(rows[0]?.doubles).toEqual([1]);
  });
});
