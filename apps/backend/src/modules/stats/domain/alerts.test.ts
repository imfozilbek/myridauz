import type { Funnel } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { alertsOf, type AlertRules } from './alerts';

const rules: AlertRules = { errorGrowth: 3, minErrors: 10, dropGrowth: 20, minPeople: 20, repeatHours: 6 };
const funnel = (opened: number, searched: number, drop: number): Funnel => ({
  id: 'passenger',
  steps: [
    { step: 'opened', count: opened, drop: null },
    { step: 'searched', count: searched, drop },
  ],
});
const quiet = { hourErrors: 0, dayErrors: 0, day: [], week: [] };

describe('alertsOf (docs/29)', () => {
  it('signals errors 3 times above the usual hour, from 10 errors', () => {
    expect(alertsOf(rules, { ...quiet, hourErrors: 12, dayErrors: 48 })).toEqual([
      { key: 'errors', kind: 'errors', hour: 12, usual: 2 },
    ]);
    expect(alertsOf(rules, { ...quiet, hourErrors: 9, dayErrors: 0 })).toEqual([]);
    expect(alertsOf(rules, { ...quiet, hourErrors: 20, dayErrors: 240 })).toEqual([]);
  });

  it('signals a step 20 points worse than the week, from 20 people', () => {
    const alerts = alertsOf(rules, { ...quiet, day: [funnel(50, 20, 60)], week: [funnel(500, 300, 40)] });
    expect(alerts).toEqual([
      {
        key: 'drop:passenger:searched',
        kind: 'drop',
        funnel: 'passenger',
        step: 'searched',
        drop: 60,
        usual: 40,
      },
    ]);
    expect(alertsOf(rules, { ...quiet, day: [funnel(50, 22, 56)], week: [funnel(500, 300, 40)] })).toEqual(
      [],
    );
    expect(alertsOf(rules, { ...quiet, day: [funnel(10, 1, 90)], week: [funnel(500, 300, 40)] })).toEqual([]);
  });
});
