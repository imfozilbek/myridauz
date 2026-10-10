import { afterTrip, formatPlate, HOUR_MS, MINUTE_MS, tashkentDate, type Trip } from '@platform/contracts';
import { daysLeft as wholeDays } from '../../bookings/done-tools';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import type { PlaceDirectory } from '../../places/directory';
import { useRegionRoute } from '../../places/region-route';
import { useCardDay } from '../../market/when';
import { useWhen } from '../home-when';

type Car = Trip['driver']['car'];
const withPlate = (words: string, plate: string | null) =>
  plate ? `${words} · ${formatPlate(plate)}` : words;

// The words every card of the block says the same way (G76, mockups g76/2, g76/3): when, the
// direction by regions (docs/121), the car with its plate, the minutes and hours left.
export function useDockWords(directory: PlaceDirectory, now: number) {
  const { t } = useI18n();
  const brand = useBrand();
  const when = useWhen(now);
  const cardDay = useCardDay();
  const regions = useRegionRoute(directory);
  const minutes = (ms: number) => Math.max(0, Math.ceil(ms / MINUTE_MS));
  return {
    when,
    // «Ertaga», «Bugun», «12-okt».
    day: (at: number) => cardDay(tashkentDate(at), now),
    // «6 kun» left for the stars, as the page of the trip counts them (docs/129).
    daysLeft: (trip: Pick<Trip, 'departAt' | 'km'>) =>
      t('home.dock.days', { count: wholeDays(afterTrip(brand, trip.departAt, trip.km).rateUntil, now) }),
    route: (trip: Pick<Trip, 'from' | 'to'>) => regions(trip.from, trip.to),
    car: (car: Car, plate: string | null) =>
      withPlate(
        t('home.trip.car', {
          model: car.model,
          color: t(`drivers.color.${car.color}`).toLocaleLowerCase('uz'),
        }),
        plate ?? car.plate,
      ),
    // «Oq Cobalt · 01 A 123 BC»: the car to find at the point, its colour first (mockup g76/2 state 10).
    carToFind: (car: Car, plate: string | null) =>
      withPlate(
        t('home.dock.carToFind', { color: t(`drivers.color.${car.color}`), model: car.model }),
        plate ?? car.plate,
      ),
    // «25 daq» to a moment ahead.
    minutesTo: (at: number) => t('home.dock.minutes', { minutes: String(minutes(at - now)) }),
    // «3 daq kutmoqda» since a moment.
    waits: (since: number) => t('home.dock.waits', { minutes: String(minutes(now - since)) }),
    // «5 soat 20 daq» to a deadline.
    left: (at: number) => {
      const rest = Math.max(0, at - now);
      const hours = Math.floor(rest / HOUR_MS);
      const mins = String(minutes(rest - hours * HOUR_MS));
      return hours > 0
        ? t('home.dock.left', { hours: String(hours), minutes: mins })
        : t('home.dock.minutes', { minutes: mins });
    },
  };
}

export type DockWords = ReturnType<typeof useDockWords>;
