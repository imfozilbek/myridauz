import { FAR_EXTRA_KM, type Trip } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import type { Fact } from './fact-chips';

// How the driver picks people up (docs/70), and in a search how the trip suits the passenger:
// another way, or far from the other passengers (+N km).
export function useWayFacts() {
  const { t } = useI18n();
  return (trip: Trip): Fact[] => {
    const pitak = trip.pitak?.name;
    const way: Fact =
      trip.pickupMode === 'door' || !pitak
        ? ['origin', t('way.card.door')]
        : ['origin', t(trip.pickupMode === 'pitak' ? 'way.card.pitak' : 'way.card.both', { pitak })];
    const { fit } = trip;
    if (fit && !fit.matches) return [way, ['blocked', t('way.fit.other')]];
    if (fit?.extraKm && fit.extraKm > FAR_EXTRA_KM)
      return [way, ['origin', t('way.fit.far', { km: String(fit.extraKm) })]];
    return [way];
  };
}
