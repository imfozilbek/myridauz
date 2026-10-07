import { formatPlate } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import './plate-badge.css';

// The plate as on the approved mockups: «01 A 123 BC | UZ» in a thin frame (G59).
export function PlateBadge({ plate }: { readonly plate: string }) {
  const { t } = useI18n();
  return (
    <span className="plate-badge">
      <span className="plate-badge-number">{formatPlate(plate)}</span>
      <span className="plate-badge-country">{t('drivers.plate.country')}</span>
    </span>
  );
}
