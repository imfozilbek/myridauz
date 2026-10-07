import type { TripDay } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { noonOf } from '../market/when';
import { haptic } from '../telegram/feedback';

type Props = {
  readonly days: readonly TripDay[];
  readonly date: string;
  readonly onDay: (date: string) => void;
};

// The days of a week with their trips (G59, docs/118 path 2): «Bugun 3 ta», «Ertaga 8 ta», «8-okt 5 ta».
// Three fit the screen, the others come by a swipe; an empty day says «0 ta» and stays pale.
export function DayCounts({ days, date, onDay }: Props) {
  const { t, formatShortDate } = useI18n();
  const name = (day: string, index: number) =>
    index === 0 ? t('market.day.today') : index === 1 ? t('market.day.tomorrow') : formatShortDate(noonOf(day));
  return (
    <div className="day-counts" role="tablist">
      {days.map((day, index) => (
        <button
          key={day.date}
          type="button"
          role="tab"
          className="day-count"
          aria-selected={day.date === date}
          data-empty={day.trips === 0}
          onClick={() => {
            haptic.select();
            onDay(day.date);
          }}
        >
          <span className="day-count-name">{name(day.date, index)}</span>
          <span className="day-count-trips">{t('find.dayTrips', { count: String(day.trips) })}</span>
        </button>
      ))}
    </div>
  );
}
