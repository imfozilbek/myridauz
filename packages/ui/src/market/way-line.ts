import type { Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import type { Fact } from './fact-chips';

// How the driver picks people up (docs/70): the passenger sees it on the card and chooses the trip.
export function useWayFacts() {
  const { t } = useI18n();
  return (trip: Trip): Fact[] => {
    const pitak = trip.pitak?.name;
    const way: Fact =
      trip.pickupMode === 'door' || !pitak
        ? ['origin', t('way.card.door')]
        : ['origin', t(trip.pickupMode === 'pitak' ? 'way.card.pitak' : 'way.card.both', { pitak })];
    return [way];
  };
}
