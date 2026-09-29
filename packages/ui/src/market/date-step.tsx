import { TRIP_DAYS_AHEAD, DAY_MS, tashkentDate } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Cell, Input, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { BackButton } from '../telegram/back-button';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { today, tomorrow, useDayLabel } from './when';

type DateStepProps = {
  readonly now: number;
  readonly onBack: () => void;
  readonly onDone: (date: string) => void;
};

// "Bugun", "Ertaga" by one tap; any other day from the phone calendar (docs/19).
export function DateStep({ now, onBack, onDone }: DateStepProps) {
  useScreenView('market.date');
  const { t } = useI18n();
  const dayLabel = useDayLabel();
  const [calendar, setCalendar] = useState(false);
  const [other, setOther] = useState('');
  const choose = (date: string) => {
    haptic.tap();
    onDone(date);
  };
  const first = today(now);
  const last = tashkentDate(now + TRIP_DAYS_AHEAD * DAY_MS);
  return (
    <StepLayout icon="trip" title={t('market.date.title')}>
      <BackButton onClick={calendar ? () => setCalendar(false) : onBack} />
      <List>
        <Section>
          {calendar ? (
            <Input
              type="date"
              aria-label={t('market.date.title')}
              min={first}
              max={last}
              value={other}
              onChange={(event) => setOther(event.target.value)}
            />
          ) : (
            [
              <Cell key="today" onClick={() => choose(first)}>
                {dayLabel(first, now)}
              </Cell>,
              <Cell key="tomorrow" onClick={() => choose(tomorrow(now))}>
                {dayLabel(tomorrow(now), now)}
              </Cell>,
              <Cell key="other" onClick={() => setCalendar(true)}>
                {t('market.date.otherDay')}
              </Cell>,
            ]
          )}
        </Section>
      </List>
      {calendar && other >= first && other <= last ? (
        <MainButton text={t('common.continue')} onClick={() => choose(other)} />
      ) : null}
    </StepLayout>
  );
}
