import type { Gender } from '@platform/contracts';
import { Cell, List, Section } from '../../components';
import { useScreenView } from '../../context/analytics-context';
import { useI18n } from '../../context/i18n-context';
import { Screen } from '../../screen/screen';
import { Icon } from '../../icons';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { StepLayout } from '../step-layout';

type GenderStepProps = {
  // Back from the phone, the answer chosen before: a tick, and «Davom etish» keeps it (docs/94 B7).
  readonly selected: Gender | null;
  readonly onBack: () => void;
  readonly onDone: (gender: Gender) => void;
};

// Choose, do not type (docs/19): one tap answers and moves on. Needed for docs/06.
export function GenderStep({ selected, onBack, onDone }: GenderStepProps) {
  useScreenView('registration.gender');
  const { t } = useI18n();
  const choose = (gender: Gender) => {
    haptic.select();
    onDone(gender);
  };
  const tick = (gender: Gender) => (gender === selected ? { after: <Icon name="selected" /> } : {});
  return (
    <StepLayout icon="passengers" title={t('account.gender.title')} hint={t('account.gender.hint')}>
      <Screen onBack={onBack} />
      <List>
        <Section>
          <Cell {...tick('male')} onClick={() => choose('male')}>
            {t('account.gender.male')}
          </Cell>
          <Cell {...tick('female')} onClick={() => choose('female')}>
            {t('account.gender.female')}
          </Cell>
        </Section>
      </List>
      {selected ? <MainButton text={t('common.continue')} onClick={() => choose(selected)} /> : null}
    </StepLayout>
  );
}
