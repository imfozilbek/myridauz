import { arrivalAt, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

export type Timed = Pick<Trip, 'departAt' | 'departUntil'>;

// The time of a trip as people see it: "08:00", a range "08:00 … 10:00" (G90, docs/216).
export function useTripTime() {
  const { t, formatTime } = useI18n();
  return (trip: Timed) => {
    const from = formatTime(new Date(trip.departAt));
    if (trip.departUntil === null) return from;
    return t('market.trip.range', { from, to: formatTime(new Date(trip.departUntil)) });
  };
}

// "≈ 13:00": the arrival of a trip at an exact time; a range shows none (G90, docs/216).
export function useArrivalTime() {
  const { formatTime } = useI18n();
  return (trip: Timed & Pick<Trip, 'km'>) =>
    trip.departUntil === null ? formatTime(new Date(arrivalAt(trip.departAt, trip.km))) : null;
}
