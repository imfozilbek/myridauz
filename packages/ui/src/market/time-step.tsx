import { tashkentDayStart } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Input, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';

const MINUTE_MS = 60 * 1000;
const HOUR_MINUTES = 60;
const DEFAULT_TIME = '08:00';

// "07:30" on a Tashkent day → the moment in ms.
const departAt = (date: string, time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return tashkentDayStart(date) + (hours * HOUR_MINUTES + minutes) * MINUTE_MS;
};

type TimeStepProps = {
  readonly date: string;
  readonly now: number;
  readonly initial?: string;
  readonly onBack: () => void;
  readonly onDone: (departAt: number, time: string) => void;
};

// The phone's own time wheel: nothing to type (docs/19). A time that has passed is refused.
export function TimeStep({ date, now, initial = DEFAULT_TIME, onBack, onDone }: TimeStepProps) {
  useScreenView('market.time');
  const { t } = useI18n();
  const [time, setTime] = useState(initial);
  const [past, setPast] = useState(false);
  const submit = () => {
    const at = departAt(date, time);
    if (at > now) return onDone(at, time);
    haptic.error();
    setPast(true);
  };
  return (
    <StepLayout icon="trip" title={t('market.time.title')} hint={t('market.time.hint')}>
      <Screen onBack={onBack} />
      <List>
        <Section>
          <Input
            type="time"
            aria-label={t('market.time.title')}
            value={time}
            status={past ? 'error' : 'default'}
            onChange={(event) => {
              setTime(event.target.value);
              setPast(false);
            }}
          />
        </Section>
      </List>
      {past ? <Text className="step-error">{t('errors.trips.in_past')}</Text> : null}
      <MainButton text={t('common.continue')} onClick={submit} />
    </StepLayout>
  );
}
