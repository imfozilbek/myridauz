import { TRIP_DAYS_AHEAD, DAY_MS, tashkentDate } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Cell, Input, List, Section } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useI18n } from '../context/i18n-context';
import { Icon } from '../icons';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { today, tomorrow, useDayLabel } from './when';

type DateStepProps = {
  readonly now: number;
  // Back from the next step, the day chosen before (docs/94 F8): a tick, or the calendar with it.
  readonly initial?: string;
  readonly onBack: () => void;
  readonly onDone: (date: string) => void;
};

// "Bugun", "Ertaga" by one tap; any other day from the phone calendar (docs/19).
export function DateStep({ now, initial, onBack, onDone }: DateStepProps) {
  useScreenView('market.date');
  const { t } = useI18n();
  const dayLabel = useDayLabel();
  const first = today(now);
  const last = tashkentDate(now + TRIP_DAYS_AHEAD * DAY_MS);
  const known = initial && initial >= first && initial <= last ? initial : null;
  const listed = known === first || known === tomorrow(now) ? known : null;
  const [calendar, setCalendar] = useState(known !== null && listed === null);
  const [other, setOther] = useState(listed === null ? (known ?? '') : '');
  const choose = (date: string) => {
    haptic.select();
    onDone(date);
  };
  const tick = (date: string) => (date === listed ? { after: <Icon name="selected" /> } : {});
  return (
    <StepLayout icon="trip" title={t('market.date.title')}>
      <Screen onBack={calendar ? () => setCalendar(false) : onBack} />
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
              <Cell key="today" {...tick(first)} onClick={() => choose(first)}>
                {dayLabel(first, now)}
              </Cell>,
              <Cell key="tomorrow" {...tick(tomorrow(now))} onClick={() => choose(tomorrow(now))}>
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
      {!calendar && listed ? <MainButton text={t('common.continue')} onClick={() => choose(listed)} /> : null}
    </StepLayout>
  );
}
