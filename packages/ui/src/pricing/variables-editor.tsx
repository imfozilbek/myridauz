import { pricingVariablesSchema, type PricingVariables } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Field, List } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { useUnsavedGuard } from '../screen/unsaved-guard';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';

const FIELDS = ['ratePerKm', 'roundStep', 'minPrice', 'maxPrice'] as const;

type VariablesEditorProps = {
  readonly current: PricingVariables;
  // Back from the preview: the numbers typed before it (docs/94 B9).
  readonly typed: PricingVariables | null;
  readonly onBack: () => void;
  readonly onPreview: (next: PricingVariables) => void;
};

// The four numbers of the formula (docs/23). Nothing is saved here: the next screen shows the effect.
export function VariablesEditor({ current, typed, onBack, onPreview }: VariablesEditorProps) {
  useScreenView('pricing.edit');
  const { t } = useI18n();
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((field) => [field, String((typed ?? current)[field])])),
  );
  const guard = useUnsavedGuard(FIELDS.some((field) => values[field] !== String(current[field])));
  const [invalid, setInvalid] = useState(false);
  const submit = () => {
    const parsed = pricingVariablesSchema.safeParse(
      Object.fromEntries(FIELDS.map((field) => [field, Number(values[field])])),
    );
    if (parsed.success) return onPreview(parsed.data);
    haptic.error();
    setInvalid(true);
  };
  return (
    <StepLayout icon="statistics" title={t('pricing.editTitle')} hint={t('pricing.editHint')}>
      <Screen onBack={guard(onBack)} />
      <List>
        {FIELDS.map((field) => (
          <Field
            key={field}
            label={t(`pricing.${field}`)}
            type="number"
            inputMode="numeric"
            value={values[field] ?? ''}
            status={invalid ? 'error' : 'default'}
            onChange={(event) => {
              setValues((all) => ({ ...all, [field]: event.target.value }));
              setInvalid(false);
            }}
          />
        ))}
      </List>
      {invalid ? <Text className="step-error">{t('pricing.invalid')}</Text> : null}
      <MainButton text={t('pricing.preview')} onClick={submit} />
    </StepLayout>
  );
}
