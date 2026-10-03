import { SegmentedControl } from '../components';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { today, tomorrow } from './when';

type Props = {
  readonly date: string;
  readonly now: number;
  readonly onDay: (date: string) => void;
  readonly onOther: () => void;
};

// The day lives on the results (G35, docs/97 K2): «Bugun», «Ertaga» by one tap, any other day from
// the phone calendar. No screen of its own before the trips.
export function DayChips({ date, now, onDay, onOther }: Props) {
  const { t } = useI18n();
  const day = (value: string) => () => {
    haptic.select();
    onDay(value);
  };
  const known = date === today(now) || date === tomorrow(now);
  return (
    <div className="day-chips">
      <SegmentedControl>
        <SegmentedControl.Item selected={date === today(now)} onClick={day(today(now))}>
          {t('market.day.today')}
        </SegmentedControl.Item>
        <SegmentedControl.Item selected={date === tomorrow(now)} onClick={day(tomorrow(now))}>
          {t('market.day.tomorrow')}
        </SegmentedControl.Item>
        <SegmentedControl.Item selected={!known} onClick={onOther}>
          {t('market.date.otherDay')}
        </SegmentedControl.Item>
      </SegmentedControl>
    </div>
  );
}
