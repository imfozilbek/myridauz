import { describe, expect, it } from 'vitest';
import { createHealthReport } from './health-report';

describe('createHealthReport', () => {
  it('reports ok with the current time', () => {
    const now = new Date('2026-09-28T10:00:00.000Z');
    expect(createHealthReport(now)).toEqual({ status: 'ok', time: '2026-09-28T10:00:00.000Z' });
  });
});
