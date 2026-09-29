import type { AlertRules } from '@platform/brands';
import type { Funnel, FunnelId, FunnelStepId } from '@platform/contracts';

// Thresholds of the signals: brand settings, never code (docs/29, docs/22).
export type { AlertRules };

export type Alert =
  | { readonly key: string; readonly kind: 'errors'; readonly hour: number; readonly usual: number }
  | {
      readonly key: string;
      readonly kind: 'drop';
      readonly funnel: FunnelId;
      readonly step: FunnelStepId;
      readonly drop: number;
      readonly usual: number;
    };

const HOURS_IN_DAY = 24;

export type AlertInput = {
  readonly hourErrors: number;
  readonly dayErrors: number;
  readonly day: readonly Funnel[];
  readonly week: readonly Funnel[];
};

function errorAlert(rules: AlertRules, { hourErrors, dayErrors }: AlertInput): Alert[] {
  const usual = dayErrors / HOURS_IN_DAY;
  const high = hourErrors >= rules.minErrors && hourErrors >= rules.errorGrowth * Math.max(usual, 1);
  return high ? [{ key: 'errors', kind: 'errors', hour: hourErrors, usual: Math.round(usual) }] : [];
}

function dropAlerts(rules: AlertRules, today: Funnel, week: Funnel | undefined): Alert[] {
  return today.steps.flatMap((step, index) => {
    const before = today.steps[index - 1];
    const usual = week?.steps[index]?.drop ?? 0;
    if (!before || step.drop === null || before.count < rules.minPeople) return [];
    if (step.drop - usual < rules.dropGrowth) return [];
    const key = `drop:${today.id}:${step.step}`;
    return [{ key, kind: 'drop', funnel: today.id, step: step.step, drop: step.drop, usual }];
  });
}

export const alertsOf = (rules: AlertRules, input: AlertInput): Alert[] => [
  ...errorAlert(rules, input),
  ...input.day.flatMap((funnel) =>
    dropAlerts(
      rules,
      funnel,
      input.week.find((week) => week.id === funnel.id),
    ),
  ),
];
