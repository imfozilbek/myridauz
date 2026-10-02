import type { Gender } from '@platform/contracts';
import { Cell, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { BackButton } from '../../telegram/back-button';
import { haptic } from '../../telegram/feedback';
import { StepLayout } from '../step-layout';

type GenderStepProps = { readonly onBack: () => void; readonly onDone: (gender: Gender) => void };

// Choose, do not type (docs/19): one tap answers and moves on. Needed for docs/06.
export function GenderStep({ onBack, onDone }: GenderStepProps) {
  useScreenView('registration.gender');
  const { t } = useI18n();
  const choose = (gender: Gender) => {
    haptic.select();
    onDone(gender);
  };
  return (
    <StepLayout icon="passengers" title={t('account.gender.title')} hint={t('account.gender.hint')}>
      <BackButton onClick={onBack} />
      <List>
        <Section>
          <Cell onClick={() => choose('male')}>{t('account.gender.male')}</Cell>
          <Cell onClick={() => choose('female')}>{t('account.gender.female')}</Cell>
        </Section>
      </List>
    </StepLayout>
  );
}
