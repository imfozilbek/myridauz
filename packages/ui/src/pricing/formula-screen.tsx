import { pricingVariablesSchema, type PricingPreview, type PricingVariables } from '@platform/contracts';
import { useEffect, useState } from 'react';
import { useApiClients } from '../context/api-clients';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { ManageGroup, ManageNote, ManagePage, ManageRow } from '../manage/manage-page';
import { usePlaceLabel } from '../market/places-gate';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { MainButton } from '../telegram/bottom-button';
import { FIELDS } from './pricing-view';

// The prices follow the typing after a short pause, not every key.
const PAUSE_MS = 400;

type Props = {
  readonly current: PricingVariables;
  readonly onBack: () => void;
  readonly onSave: (next: PricingVariables) => void;
};

// The four numbers of the formula and how the prices of the main directions change, on one screen
// (docs/23, G78 sheet 4): nothing is saved before «Saqlash».
export function FormulaScreen({ current, onBack, onSave }: Props) {
  useScreenView('pricing.edit');
  const { t, formatNumber } = useI18n();
  const { pricing } = useApiClients();
  const place = usePlaceLabel();
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((field) => [field, String(current[field])])),
  );
  const [preview, setPreview] = useState<PricingPreview | null>(null);
  const guard = useUnsavedGuard(FIELDS.some((field) => values[field] !== String(current[field])));
  const parsed = pricingVariablesSchema.safeParse(
    Object.fromEntries(FIELDS.map((field) => [field, Number(values[field])])),
  );
  const next = parsed.success ? parsed.data : null;
  const key = next ? JSON.stringify(next) : null;
  useEffect(() => {
    if (!key) return undefined;
    const timer = setTimeout(() => {
      pricing.preview(JSON.parse(key) as PricingVariables).then(setPreview, () => setPreview(null));
    }, PAUSE_MS);
    return () => clearTimeout(timer);
  }, [key, pricing]);
  return (
    <ManagePage title={t('pricing.editTitle')} hint={t('pricing.editHint')} onBack={guard(onBack)}>
      <ManageGroup>
        {FIELDS.map((field) => (
          <label key={field} className="navbat-row manage-row manage-number">
            <span className="navbat-title">{t(`pricing.${field}`)}</span>
            <input
              inputMode="numeric"
              value={values[field] ?? ''}
              onChange={(event) => setValues((all) => ({ ...all, [field]: event.target.value }))}
            />
          </label>
        ))}
      </ManageGroup>
      {next ? null : <ManageNote>{t('pricing.invalid')}</ManageNote>}
      {next && preview ? (
        <ManageGroup title={t('pricing.previewTitle')}>
          {preview.rows.map((row) => (
            <ManageRow
              key={`${row.from}:${row.to}`}
              icon="trip"
              title={t('common.route', { from: place(row.from).name, to: place(row.to).name })}
              value={
                row.after === row.before ? (
                  t('common.route', { from: formatNumber(row.before), to: formatNumber(row.after) })
                ) : (
                  // The new price of a changed direction stands out (docs/86 V13).
                  <>
                    {t('common.route', { from: formatNumber(row.before), to: '' })}
                    <span className="manage-changed">{formatNumber(row.after)}</span>
                  </>
                )
              }
            />
          ))}
        </ManageGroup>
      ) : null}
      {next ? <MainButton text={t('pricing.save')} onClick={() => onSave(next)} /> : null}
    </ManagePage>
  );
}
