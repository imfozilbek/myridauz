import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

// How the driver picks people up (docs/70): the passenger sees it on the card and chooses the trip;
// the driver sees the same words on a past trip of «Oʻtgan» (G78 sheet 3).
export function useWayText() {
  const { t } = useI18n();
  return (trip: Trip): string => {
    const pitak = trip.pitak?.name;
    return trip.pickupMode === 'door' || !pitak
      ? t('way.card.door')
      : t(trip.pickupMode === 'pitak' ? 'way.card.pitak' : 'way.card.both', { pitak });
  };
}
