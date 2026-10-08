import { DAY_MS, TRIP_DAYS_AHEAD, defaultSlot, tashkentDate, type Schedule } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { Input, List, Section, Select } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { haptic } from '../telegram/feedback';
import { DayChips } from './day-chips';
import { departAtOf, firstDayOf, slotsOn } from './first-when';
import { today, useDayLabel } from './when';

type WhenStepProps = {
  readonly now: number;
  readonly schedule: Schedule;
  // The day of a request: the driver chooses only the time (docs/35).
  readonly fixedDate?: string;
  readonly initial?: { readonly date: string; readonly time?: string };
  readonly onBack: () => void;
  readonly onDone: (when: { date: string; time: string; departAt: number }) => void;
};

// The day and the time on one screen (G38, docs/103): only the times the driver may leave at, the
// morning time on another day, the first free time today.
export function WhenStep({ now, schedule, fixedDate, initial, onBack, onDone }: WhenStepProps) {
  useScreenView('market.when');
  const { t } = useI18n();
  const rules = useBrand().schedule;
  const dayLabel = useDayLabel();
  const first = today(now);
  const last = tashkentDate(now + TRIP_DAYS_AHEAD * DAY_MS);
  const [date, setDate] = useState(fixedDate ?? initial?.date ?? firstDayOf(now, schedule, rules));
  const [calendar, setCalendar] = useState(false);
  const slots = slotsOn(date, now, schedule, rules);
  const kept = initial?.time && initial.date === date && slots.includes(initial.time) ? initial.time : null;
  const [picked, setPicked] = useState<string | null>(kept);
  const time = picked !== null && slots.includes(picked) ? picked : defaultSlot(slots, date === first, rules);
  const pick = (day: string) => {
    haptic.select();
    setDate(day);
    setPicked(null);
  };
  const back = calendar && !fixedDate ? () => setCalendar(false) : onBack;
  return (
    <StepLayout
      icon="trip"
      title={t(fixedDate ? 'market.time.title' : 'market.when.title')}
      hint={fixedDate ? t('market.when.dayHint', { day: dayLabel(fixedDate, now) }) : t('market.time.hint')}
    >
      <Screen onBack={back} />
      {fixedDate ? null : <DayChips date={date} now={now} onDay={pick} onOther={() => setCalendar(true)} />}
      <List>
        {calendar && !fixedDate ? (
          <Section header={t('market.when.day')}>
            <Input
              type="date"
              aria-label={t('market.date.title')}
              min={first}
              max={last}
              value={date}
              onChange={(event) => event.target.value && pick(event.target.value)}
            />
          </Section>
        ) : null}
        <Section header={t('market.when.time')}>
          {time ? (
            <Select
              aria-label={t('market.time.title')}
              value={time}
              onChange={(event) => setPicked(event.target.value)}
            >
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          ) : null}
        </Section>
      </List>
      {schedule.full ? <Text className="step-error">{t('errors.trips.too_many')}</Text> : null}
      {!schedule.full && !time ? <Text className="step-error">{t('market.when.none')}</Text> : null}
      {time && !schedule.full ? (
        <MainButton
          text={t('common.continue')}
          onClick={() => onDone({ date, time, departAt: departAtOf(date, time) })}
        />
      ) : null}
    </StepLayout>
  );
}
