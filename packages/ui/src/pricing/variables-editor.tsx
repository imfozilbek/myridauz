import { pricingVariablesSchema, type PricingVariables } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Input, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';

const FIELDS = ['ratePerKm', 'roundStep', 'minPrice', 'maxPrice'] as const;

type VariablesEditorProps = {
  readonly current: PricingVariables;
  readonly onBack: () => void;
  readonly onPreview: (next: PricingVariables) => void;
};

// The four numbers of the formula (docs/23). Nothing is saved here: the next screen shows the effect.
export function VariablesEditor({ current, onBack, onPreview }: VariablesEditorProps) {
  useScreenView('pricing.edit');
  const { t } = useI18n();
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((field) => [field, String(current[field])])),
  );
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
      <BackButton onClick={onBack} />
      <List>
        <Section>
          {FIELDS.map((field) => (
            <Input
              key={field}
              header={t(`pricing.${field}`)}
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
        </Section>
      </List>
      {invalid ? <Text className="step-error">{t('pricing.invalid')}</Text> : null}
      <MainButton text={t('pricing.preview')} onClick={submit} />
    </StepLayout>
  );
}
