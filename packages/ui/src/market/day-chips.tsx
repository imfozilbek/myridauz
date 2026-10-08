import { SegmentedControl } from '../components';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { noonOf, today, tomorrow } from './when';
import './day-chips.css';

type Props = {
  readonly date: string;
  readonly now: number;
  readonly onDay: (date: string) => void;
  readonly onOther: () => void;
};

// The day lives on the results (G35, docs/97 K2): «Bugun», «Ertaga» by one tap, any other day from
// the phone calendar, then shown on its chip. No screen of its own before the trips.
export function DayChips({ date, now, onDay, onOther }: Props) {
  const { t, formatDate } = useI18n();
  const day = (value: string) => () => {
    haptic.select();
    onDay(value);
  };
  const known = date === today(now) || date === tomorrow(now);
  // A tab says it is chosen to a screen reader too, not by the color only.
  return (
    <div className="day-chips">
      <SegmentedControl>
        <SegmentedControl.Item
          className="day-chip"
          selected={date === today(now)}
          aria-selected={date === today(now)}
          onClick={day(today(now))}
        >
          {t('market.day.today')}
        </SegmentedControl.Item>
        <SegmentedControl.Item
          className="day-chip"
          selected={date === tomorrow(now)}
          aria-selected={date === tomorrow(now)}
          onClick={day(tomorrow(now))}
        >
          {t('market.day.tomorrow')}
        </SegmentedControl.Item>
        <SegmentedControl.Item
          className="day-chip"
          selected={!known}
          aria-selected={!known}
          onClick={onOther}
        >
          {/* The chosen day itself, so no title above repeats it (G40, docs/106 C6). */}
          {known ? t('market.date.otherDay') : formatDate(noonOf(date))}
        </SegmentedControl.Item>
      </SegmentedControl>
    </div>
  );
}
