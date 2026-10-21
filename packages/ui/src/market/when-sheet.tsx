import { defaultSlot, rangeEnds, rangeStarts, slotAt, type Schedule } from '@platform/contracts';
import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useScreenView } from '../context/analytics-context';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { weekOf } from '../days/week';
import { WeekRow } from '../days/week-row';
import { FormSheet } from '../sheet/form-sheet';
import { firstDayOf, slotsOn } from './first-when';
import { RangeGrid } from './range-grid';
import { TimeGrid } from './time-grid';
import { KINDS, kindOf, ofKind, TimeKinds, type Kind } from './time-kinds';
import { today } from './when';
import './when-sheet.css';

// until: the end of a range (docs/216); null: one exact time.
type When = {
  readonly date: string;
  readonly time: string;
  readonly departAt: number;
  readonly until: string | null;
  readonly departUntil: number | null;
};
type Props = {
  readonly open: boolean;
  readonly now: number;
  readonly schedule: Schedule;
  readonly initial?: { readonly date: string; readonly time?: string; readonly until?: string | null };
  readonly onClose: () => void;
  readonly onDone: (when: When) => void;
};

// «Qachon joʻnaysiz?» over the trip (G75, mockup g75/3 A phone 1): the day from the row of the week
// (docs/172), the time from the tiles of the free whole or half hours (G38, docs/103; owner decisions
// 12.10.2026) or a range of whole hours (G90, mockup g90); the last tap closes the sheet, no «Tayyor»
// (G78 В12). The hint under the title tells the step of a range.
export function WhenSheet({ open, onClose, ...rest }: Props) {
  const { t } = useI18n();
  return (
    <FormSheet open={open} title={t('market.when.title')} onClose={onClose}>
      {open ? <WhenChoice {...rest} /> : null}
    </FormSheet>
  );
}

function WhenChoice({ now, schedule, initial, onDone }: Omit<Props, 'open' | 'onClose'>) {
  useScreenView('market.when');
  const { t } = useI18n();
  const rules = useBrand().schedule;
  const [date, setDate] = useState(initial?.date ?? firstDayOf(now, rules));
  // null: the kind of the time of the day; a range stays a range on another day.
  const [picked, setPicked] = useState<Kind | null>(initial?.until ? 'range' : null);
  const [from, setFrom] = useState<string | null>(null);
  const [kept, setKept] = useState(true);
  const slots = slotsOn(date, now, rules);
  const starts = rangeStarts(date, now, rules);
  const mine = initial?.date === date ? initial : undefined;
  const time =
    (mine?.time && slots.includes(mine.time) ? mine.time : null) ??
    defaultSlot(slots, date === today(now), rules);
  const kinds = KINDS.filter((one) => (one === 'range' ? starts : ofKind(slots, one)).length > 0);
  const wanted = picked ?? kindOf(time);
  const kind = kinds.includes(wanted) ? wanted : (kinds[0] ?? wanted);
  const chosen =
    kept &&
    mine?.time &&
    mine.until &&
    starts.includes(mine.time) &&
    rangeEnds(date, mine.time, rules).includes(mine.until)
      ? { from: mine.time, to: mine.until }
      : null;
  // At the limit of trips no time goes: the line under the tiles says why (G38).
  const done = (start: string, until: string | null) => {
    if (schedule.full) return;
    const departUntil = until ? slotAt(date, until) : null;
    onDone({ date, time: start, departAt: slotAt(date, start), until, departUntil });
  };
  const step = (next: string | null) => {
    setFrom(next);
    setKept(false);
  };
  const hint =
    kind !== 'range'
      ? t('market.time.hint')
      : from
        ? t('market.when.rangeTo', { from, hours: String(rules.rangeMaxHours) })
        : t('market.when.rangeFrom');
  return (
    <>
      <p className="form-sheet-hint">{hint}</p>
      <div className="when-week">
        <WeekRow
          days={weekOf(now).map((day) => ({ date: day, marked: false }))}
          on={date}
          onPick={(day) => {
            setDate(day);
            setFrom(null);
            setPicked((was) => (was === 'range' ? was : null));
          }}
        />
      </div>
      <TimeKinds
        kinds={kinds}
        kind={kind}
        onKind={(next) => {
          setPicked(next);
          setFrom(null);
        }}
      />
      {kind === 'range' ? (
        <RangeGrid
          date={date}
          starts={starts}
          from={from}
          chosen={chosen}
          onFrom={step}
          onTo={(to) => from && done(from, to)}
        />
      ) : (
        <TimeGrid slots={ofKind(slots, kind)} time={time} onTime={(slot) => done(slot, null)} />
      )}
      {schedule.full ? <Text className="step-error">{t('errors.trips.too_many')}</Text> : null}
      {!schedule.full && kinds.length === 0 ? (
        <Text className="step-error">{t('market.when.none')}</Text>
      ) : null}
    </>
  );
}
