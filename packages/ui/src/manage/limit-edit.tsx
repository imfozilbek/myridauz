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

// A short range of whole numbers goes by «−» and «+» (G79 К9); a long one (the days of a year, the
// minutes, the stars in tenths, a sum) is typed: a few taps never become hundreds.
const STEPPER_MAX_TAPS = 20;

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
  const stepper = rule.unit !== 'sum' && rule.unit !== 'stars' && rule.max - rule.min <= STEPPER_MAX_TAPS;
  const stepBy = (by: -1 | 1) => setText(String(Math.min(rule.max, Math.max(rule.min, next + by))));
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
          {!stepper ? (
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
