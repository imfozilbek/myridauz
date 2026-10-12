import { defaultSlot, type Schedule } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { weekOf } from '../days/week';
import { WeekRow } from '../days/week-row';
import { FormSheet } from '../sheet/form-sheet';
import { departAtOf, firstDayOf, slotsOn } from './first-when';
import { TimeGrid } from './time-grid';
import { today } from './when';
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

// «Qachon joʻnaysiz?» over the trip (G75, mockup g75/3 A phone 1): the day from the row of the week
// (docs/172), the time from the tiles of the free whole or half hours (G38, docs/103; owner decisions
// 12.10.2026); the tap on a time closes the sheet with both, no «Tayyor» (G78 В12).
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
  const [date, setDate] = useState(initial?.date ?? firstDayOf(now, rules));
  const slots = slotsOn(date, now, rules);
  const kept = initial?.time && initial.date === date && slots.includes(initial.time) ? initial.time : null;
  const time = kept ?? defaultSlot(slots, date === today(now), rules);
  return (
    <>
      <div className="when-week">
        <WeekRow days={weekOf(now).map((day) => ({ date: day, marked: false }))} on={date} onPick={setDate} />
      </div>
      {/* A new day opens on the kind of its own time. */}
      <TimeGrid
        key={date}
        allowed={slots}
        time={time}
        onTime={(picked) => {
          // At the limit of trips no time goes: the line under the tiles says why (G38).
          if (!schedule.full) onDone({ date, time: picked, departAt: departAtOf(date, picked) });
        }}
      />
      {schedule.full ? <Text className="step-error">{t('errors.trips.too_many')}</Text> : null}
      {!schedule.full && !time ? <Text className="step-error">{t('market.when.none')}</Text> : null}
    </>
  );
}
