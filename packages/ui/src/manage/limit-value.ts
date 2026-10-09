import { LIMITS, type LimitKey } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';

// A limit in words with its unit: «3 ta», «60 daq», «24 soat», «30 kun», «10 %», «9 000 soʻm»,
// «07:00», «3,5» (G75, docs/128 §4).
export function useLimitValue() {
  const { t, formatMoney, formatRating } = useI18n();
  return (key: LimitKey, value: number): string => {
    if (Number.isNaN(value)) return '';
    switch (LIMITS[key].unit) {
      case 'sum':
        return formatMoney(value);
      case 'stars':
        return formatRating(value);
      case 'hour':
        return t('manage.unit.hour', { value: String(value).padStart(2, '0') });
      default:
        return t(`manage.unit.${LIMITS[key].unit}`, { value });
    }
  };
}
