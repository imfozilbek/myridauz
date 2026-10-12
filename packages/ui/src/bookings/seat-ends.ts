import type { BookedPlace, Booking } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { usePlaceLabel, type PlaceLabel } from '../market/places-gate';
import { useNameText } from '../way/way-end';

// The ends of a seat on its route (G78 sheet 3, d-seat): the pitak or the point of the passenger in
// place of the ends of the trip, the end under it unless the text names it already. Before the
// confirmation the point is hidden (docs/07): the area with the extra km.
export function useSeatEnds() {
  const { t } = useI18n();
  const place = usePlaceLabel();
  const nameText = useNameText();
  return (booking: Booking) => {
    const { trip, pitak, pickup, dropoff } = booking;
    const extra = booking.extraKm === null ? null : String(booking.extraKm);
    const described = (at: BookedPlace) => {
      if (at.point) return nameText(at.name, '');
      const area = nameText(at.area, '');
      return extra === null ? t('way.driver.areaOnly', { area }) : t('way.driver.area', { area, km: extra });
    };
    const end = (id: string, text: string | null): PlaceLabel => {
      const label = place(id);
      if (text === null) return label;
      const named = text.includes(label.name);
      return { name: text, area: named ? label.area : t('way.driver.endHint', label) };
    };
    return {
      from: end(trip.from, pitak ? pitak.name : pickup ? described(pickup) : null),
      to: end(trip.to, dropoff ? described(dropoff) : null),
    };
  };
}
