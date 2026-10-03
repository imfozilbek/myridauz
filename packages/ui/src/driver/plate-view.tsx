import { formatPlate } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import './driver.css';
import './plate.css';

// A plate shown as it looks on the car, to compare it with a photo (docs/50); small inside a list.
export function PlateView({ plate, small = false }: { readonly plate: string; readonly small?: boolean }) {
  const { t } = useI18n();
  return (
    <span className={small ? 'plate plate-view plate-small' : 'plate plate-view'}>
      <span className="plate-field">
        <span className="plate-input">{formatPlate(plate)}</span>
      </span>
      <span className="plate-country">{t('drivers.plate.country')}</span>
    </span>
  );
}
