import type { TripDay } from '@platform/contracts';
import { useEffect, useRef } from 'react';
import { useI18n } from '../context/i18n-context';
import { noonOf } from '../market/when';
import { haptic } from '../telegram/feedback';

type Props = {
  readonly days: readonly TripDay[];
  readonly date: string;
  readonly onDay: (date: string) => void;
};

// The days of a week with their trips (G59, docs/118 path 2): «Bugun 3 ta», «Ertaga 8 ta», «8-okt 5 ta».
// A ribbon, three in sight (mockup screen 5); an empty day says «0 ta», pale.
export function DayCounts({ days, date, onDay }: Props) {
  const { t, formatShortDate } = useI18n();
  const name = (day: string, index: number) =>
    index === 0
      ? t('market.day.today')
      : index === 1
        ? t('market.day.tomorrow')
        : formatShortDate(noonOf(day));
  // The chosen day is always in sight: only the ribbon moves sideways, never the page (G33 F2).
  const ribbon = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ribbon.current;
    const chosen = box?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!box || !chosen) return;
    const left = chosen.offsetLeft - box.offsetLeft;
    if (left < box.scrollLeft || left + chosen.offsetWidth > box.scrollLeft + box.clientWidth)
      box.scrollLeft = left;
  }, [date]);
  return (
    <div className="day-counts" role="tablist" ref={ribbon}>
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
