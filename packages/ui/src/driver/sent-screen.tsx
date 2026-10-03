import { hourLabel } from '@platform/contracts';
import { StepLayout } from '../account/step-layout';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';

// Right after sending (G34): when the answer comes. The team checks in its hours of the brand.
export function SentScreen({ onDone }: { readonly onDone: () => void }) {
  useScreenView('driver.sent');
  const { t } = useI18n();
  const { from, to } = useBrand().moderation.hours;
  return (
    <StepLayout
      hero
      icon="waiting"
      title={t('drivers.sent.title')}
      hint={t('drivers.sent.text', { from: hourLabel(from), to: hourLabel(to) })}
    >
      <Screen onBack={onDone} />
      <MainButton text={t('common.continue')} onClick={onDone} />
    </StepLayout>
  );
}
