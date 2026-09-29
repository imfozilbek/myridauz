import { formatPlate } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import './driver.css';

// A plate shown as it looks on the car, to compare it with a photo (docs/50).
export function PlateView({ plate }: { readonly plate: string }) {
  const { t } = useI18n();
  return (
    <span className="plate plate-view">
      <span className="plate-field">
        <span className="plate-input">{formatPlate(plate)}</span>
      </span>
      <span className="plate-country">{t('drivers.plate.country')}</span>
    </span>
  );
}
