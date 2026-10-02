import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';

// Under «Jami» of a passenger: the money goes to the driver on the trip, the brand takes none
// from passengers (owner decision 02.10.2026, docs/89 P2).
export function usePayHint(): string {
  const { t } = useI18n();
  return t('bookings.review.payHint', { brand: useBrand().name });
}
