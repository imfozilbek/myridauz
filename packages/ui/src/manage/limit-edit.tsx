import { LIMITS, limitFits, type LimitKey, type Limits } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { haptic } from '../telegram/feedback';
import { ManageGroup, ManagePage } from './manage-page';
import { useLimitValue } from './limit-value';

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
          <input
            inputMode="decimal"
            aria-label={t(`manage.limit.${limitKey}`)}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <button type="submit" disabled={!fits || next === value}>
            {t('manage.limitSave')}
          </button>
        </form>
      </ManageGroup>
      <ActionFailure error={failure} />
    </ManagePage>
  );
}
