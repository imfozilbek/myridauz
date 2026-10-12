import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import type { WeekDay } from './week';
import './week-row.css';

// The short names of the days from Sunday, as a date counts them (mockup g64/6: «Du … Ya»).
const DAYS: readonly TranslationKey[] = [
  'driverTrip.week.sun',
  'driverTrip.week.mon',
  'driverTrip.week.tue',
  'driverTrip.week.wed',
  'driverTrip.week.thu',
  'driverTrip.week.fri',
  'driverTrip.week.sat',
];
const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

type Props = {
  // Today and the six days after it.
  readonly days: readonly WeekDay[];
  // The day that stands out; null: none yet (the day of a request).
  readonly on: string | null;
  readonly onPick: (date: string) => void;
};

// The row of the week (G64, mockup g64/6), everywhere a day is chosen since the owner's decision of
// 12.10.2026 (docs/172): «Bugun» and the days after it, the number, the dot of a day that has some.
export function WeekRow({ days, on, onPick }: Props) {
  const { t } = useI18n();
  return (
    <div className="week-row">
      {days.map(({ date, marked }, index) => (
        <button
          key={date}
          type="button"
          className="week-day"
          aria-pressed={date === on}
          data-on={date === on ? '' : undefined}
          onClick={() => {
            haptic.select();
            onPick(date);
          }}
        >
          <span>
            {index === 0 ? t('driverTrip.week.today') : t(DAYS[weekday(date)] ?? 'driverTrip.week.sun')}
          </span>
          <b>{Number(date.slice(-2))}</b>
          <i className={marked ? 'week-dot' : 'week-dot week-dot-none'} />
        </button>
      ))}
    </div>
  );
}
