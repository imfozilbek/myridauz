import { DAY_MS, defaultSlot, tashkentDate, type Schedule } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { Input } from '../components';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { FormSheet } from '../sheet/form-sheet';
import { MainButton } from '../telegram/bottom-button';
import { departAtOf, firstDayOf, slotsOn } from './first-when';
import { TimeGrid } from './time-grid';
import { today } from './when';
import { WhenDays } from './when-days';
import './when-sheet.css';

type When = { readonly date: string; readonly time: string; readonly departAt: number };
type Props = {
  readonly open: boolean;
  readonly now: number;
  readonly schedule: Schedule;
  readonly initial?: { readonly date: string; readonly time?: string };
  readonly onClose: () => void;
  readonly onDone: (when: When) => void;
};

// «Qachon joʻnaysiz?» over the trip (G75, mockup g75/3 A phone 1): the day by one tap, the time from
// the tiles of the free half hours (G38, docs/103), nothing to type.
export function WhenSheet({ open, onClose, ...rest }: Props) {
  const { t } = useI18n();
  return (
    <FormSheet open={open} title={t('market.when.title')} hint={t('market.time.hint')} onClose={onClose}>
      {open ? <WhenChoice {...rest} /> : null}
    </FormSheet>
  );
}

function WhenChoice({ now, schedule, initial, onDone }: Omit<Props, 'open' | 'onClose'>) {
  useScreenView('market.when');
  const { t } = useI18n();
  const rules = useBrand().schedule;
  const first = today(now);
  const last = tashkentDate(now + rules.daysAhead * DAY_MS);
  const [date, setDate] = useState(initial?.date ?? firstDayOf(now, schedule, rules));
  const [calendar, setCalendar] = useState(false);
  const slots = slotsOn(date, now, schedule, rules);
  const kept = initial?.time && initial.date === date && slots.includes(initial.time) ? initial.time : null;
  const [picked, setPicked] = useState<string | null>(kept);
  const time = picked !== null && slots.includes(picked) ? picked : defaultSlot(slots, date === first, rules);
  const pick = (day: string) => {
    setDate(day);
    setPicked(null);
  };
  return (
    <>
      <WhenDays date={date} now={now} onDay={pick} onOther={() => setCalendar(true)} />
      {calendar ? (
        <Input
          className="when-calendar"
          type="date"
          aria-label={t('market.date.title')}
          min={first}
          max={last}
          value={date}
          onChange={(event) => event.target.value && pick(event.target.value)}
        />
      ) : null}
      <TimeGrid allowed={slots} time={time} onTime={setPicked} />
      {schedule.full ? <Text className="step-error">{t('errors.trips.too_many')}</Text> : null}
      {!schedule.full && !time ? <Text className="step-error">{t('market.when.none')}</Text> : null}
      {time && !schedule.full ? (
        <MainButton
          text={t('market.when.done')}
          onClick={() => onDone({ date, time, departAt: departAtOf(date, time) })}
        />
      ) : null}
    </>
  );
}
