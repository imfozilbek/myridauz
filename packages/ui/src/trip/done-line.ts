import { afterTrip, arrivalAt, DAY_MS, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { useBrand } from '../context/brand-context';

type Ended = Pick<Trip, 'departAt' | 'km' | 'arrivedAt'>;

// The plate of a trip that ended, for both sides (mockups g60/6, g60/7, g63/5 phone 5): when and
// where it ended, by «Yetib keldik» of the driver when there was one; after the deadline of a
// complaint, how long ago. A month later only the reading is left: the plate turns grey.
export function useDoneLine(trip: Ended, place: string): { readonly line: string; readonly old: boolean } {
  const { t, formatDate, formatTime } = useI18n();
  const brand = useBrand();
  const { departAt, km } = trip;
  const arrival = new Date(trip.arrivedAt ?? arrivalAt(departAt, km));
  const now = Date.now();
  const { complainUntil, pointsUntil } = afterTrip(brand, departAt, km);
  const old = now >= pointsUntil;
  if (now < complainUntil)
    return {
      line: t('bookings.done.when', { date: formatDate(arrival), time: formatTime(arrival), place }),
      old,
    };
  const days = Math.floor((now - arrival.getTime()) / DAY_MS);
  return { line: t('bookings.done.ago', { date: formatDate(arrival), days }), old };
}
