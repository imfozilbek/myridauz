import type { TranslationKey } from '@platform/i18n';
import { useI18n } from '../context/i18n-context';
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
  readonly week: readonly string[];
  // The days with a trip get their dot.
  readonly marked: ReadonlySet<string>;
  // The day that filters the list; null shows every trip and today stands out.
  readonly picked: string | null;
  readonly onPick: (date: string | null) => void;
};

// The row of the week over the trips of a driver (G64, docs/118 path 7, mockup g64/6): a tap shows
// the trips of that day only, a second tap shows them all again.
export function WeekRow({ week, marked, picked, onPick }: Props) {
  const { t } = useI18n();
  const shown = picked ?? week[0];
  return (
    <div className="week-row">
      {week.map((date, index) => (
        <button
          key={date}
          type="button"
          className="week-day"
          aria-pressed={date === picked}
          data-on={date === shown ? '' : undefined}
          onClick={() => onPick(date === picked ? null : date)}
        >
          <span>
            {index === 0 ? t('driverTrip.week.today') : t(DAYS[weekday(date)] ?? 'driverTrip.week.sun')}
          </span>
          <b>{Number(date.slice(-2))}</b>
          <i className={marked.has(date) ? 'week-dot' : 'week-dot week-dot-none'} />
        </button>
      ))}
    </div>
  );
}
