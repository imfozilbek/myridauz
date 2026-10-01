import { commissionFor } from '@platform/brands';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';

// «Har bir joy uchun 9 000 soʻm komissiya»: the rule of the brand, the same one the backend uses
// when the driver confirms a seat (docs/12, docs/86 V8).
export function useSeatCommission() {
  const { t, formatMoney } = useI18n();
  const { commission } = useBrand();
  return (price: number) =>
    t('market.price.commission', { amount: formatMoney(commissionFor(commission, price, 1)) });
}
