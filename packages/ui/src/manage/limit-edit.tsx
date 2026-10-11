import { LIMITS, limitFits, type LimitKey, type Limits } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Stepper } from '../find/stepper';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { ManageGroup, ManagePage } from './manage-page';
import { useLimitValue } from './limit-value';
import '../find/seats.css';

// A limit other than a sum goes by «−» and «+» (G79 К9): minutes by 5, stars by tenths, the rest by 1.
const STEPS: Readonly<Record<string, number>> = { minutes: 5, stars: 0.1 };
const TENTHS = 10;

type EditProps = {
  readonly limitKey: LimitKey;
  readonly value: number;
  readonly onBack: () => void;
  readonly onSaved: (limits: Limits) => void;
};

// One limit: its range and the new value; the server checks the rule again (G75, docs/128 §4).
export function LimitEdit({ limitKey, value, onBack, onSaved }: EditProps) {
  const { t } = useI18n();
  const { limits } = useApiClients();
  const valueOf = useLimitValue();
  const [text, setText] = useState(String(value));
  const { failure, fail, clear } = useFailure();
  const rule = LIMITS[limitKey];
  const next = Number(text.replace(',', '.'));
  const fits = text.trim() !== '' && limitFits(limitKey, next);
  const step = STEPS[rule.unit] ?? 1;
  const stepBy = (by: -1 | 1) => {
    const moved = Math.round((next + by * step) * TENTHS) / TENTHS;
    setText(String(Math.min(rule.max, Math.max(rule.min, moved))));
  };
  const save = async () => {
    clear();
    try {
      const state = await limits.change(limitKey, next);
      haptic.success();
      onSaved(state);
    } catch (caught) {
      fail(caught);
    }
  };
  const range = t('manage.limitRange', {
    min: valueOf(limitKey, rule.min),
    max: valueOf(limitKey, rule.max),
  });
  return (
    <ManagePage title={t(`manage.limit.${limitKey}`)} hint={range} onBack={onBack}>
      <ManageGroup title={t('manage.limitNew')}>
        <form
          className="manage-field"
          onSubmit={(event) => {
            event.preventDefault();
            if (fits) void save();
          }}
        >
          {rule.unit === 'sum' ? (
            <input
              inputMode="decimal"
              aria-label={t(`manage.limit.${limitKey}`)}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          ) : (
            <Stepper
              value={valueOf(limitKey, next)}
              atLeast={next <= rule.min}
              atMost={next >= rule.max}
              onStep={stepBy}
            />
          )}
          <button type="submit" disabled={!fits || next === value}>
            {t('manage.limitSave')}
          </button>
        </form>
      </ManageGroup>
      <ActionFailure error={failure} />
    </ManagePage>
  );
}
