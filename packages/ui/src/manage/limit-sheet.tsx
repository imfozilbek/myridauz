import { LIMITS, limitFits, type LimitKey, type Limits } from '@platform/contracts';
import { useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useI18n } from '../context/i18n-context';
import { Stepper } from '../find/stepper';
import { FormSheet } from '../sheet/form-sheet';
import { ActionFailure } from '../states/action-failure';
import { useFailure } from '../states/use-failure';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { LimitChanges } from './limit-changes';
import { useLimitValue } from './limit-value';
import '../find/seats.css';
import './limit-sheet.css';

// A short range of whole numbers goes by «−» and «+» (G79 К9); a long one (the days of a year, the
// minutes, the stars in tenths, a sum) is typed: a few taps never become hundreds. «Komissiya»
// (0 … 30 %) goes by «−» and «+», as on the mockup (G78 sheet 5).
const STEPPER_MAX_TAPS = 30;

type SheetProps = {
  readonly limitKey: LimitKey | null;
  readonly value: number;
  // The changes of every limit: the sheet shows the ones of its own (G45, Q3 of docs/111).
  readonly history: Limits['history'];
  readonly onClose: () => void;
  readonly onSaved: (limits: Limits) => void;
};

// One limit in a sheet over «Cheklovlar» (G78 sheet 5): its name, what it changes and why, the new
// value, its range and its own changes (G45, Q3 of docs/111); the server checks the rule again (G75,
// docs/128 §4).
export function LimitSheet({ limitKey, value, history, onClose, onSaved }: SheetProps) {
  const { t } = useI18n();
  const words = limitKey
    ? { title: t(`manage.limit.${limitKey}`), hint: t(`manage.limitWhy.${limitKey}`) }
    : {};
  return (
    <FormSheet open={limitKey !== null} {...words} onClose={onClose}>
      {limitKey ? (
        <>
          <LimitForm key={limitKey} limitKey={limitKey} value={value} onClose={onClose} onSaved={onSaved} />
          <LimitChanges limitKey={limitKey} history={history} />
        </>
      ) : null}
    </FormSheet>
  );
}

type FormProps = Omit<SheetProps, 'limitKey' | 'history'> & { readonly limitKey: LimitKey };

function LimitForm({ limitKey, value, onClose, onSaved }: FormProps) {
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
  // The same value closes the sheet: nothing to send.
  const save = async () => {
    clear();
    if (next === value) {
      onClose();
      return;
    }
    try {
      const state = await limits.change(limitKey, next);
      haptic.success();
      onSaved(state);
    } catch (caught) {
      fail(caught);
    }
  };
  return (
    <>
      <div className="limit-box">
        {stepper ? (
          <Stepper
            value={valueOf(limitKey, next)}
            atLeast={next <= rule.min}
            atMost={next >= rule.max}
            onStep={stepBy}
          />
        ) : (
          <input
            inputMode="decimal"
            aria-label={t(`manage.limit.${limitKey}`)}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        )}
      </div>
      <p className="manage-hint">
        {t('manage.limitRange', { min: valueOf(limitKey, rule.min), max: valueOf(limitKey, rule.max) })}
      </p>
      <ActionFailure error={failure} />
      <MainButton text={t('manage.limitSave')} disabled={!fits} onClick={save} />
    </>
  );
}
