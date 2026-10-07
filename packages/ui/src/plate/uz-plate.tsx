import { formatPlate, plateParts } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import './uz-plate.css';

export type PlateSize = 'l' | 'm' | 's';

// The flag and «UZ» at the right end of every plate (G62, mockup g62/2-plate).
export function PlateCountry() {
  const { t } = useI18n();
  return (
    <span className="uz-plate-country" aria-hidden>
      <span className="uz-plate-flag" />
      {t('drivers.plate.country')}
    </span>
  );
}

// An Uzbek plate as on the car (G62, docs/50): the region in its own cell on the left, the number in
// the middle, the flag and «UZ» on the right. One component in three sizes for every screen: l on the
// application, m on a trip and a booking, s in a list and a call.
export function UzPlate({ plate, size = 'm' }: { readonly plate: string; readonly size?: PlateSize }) {
  const { region, number } = plateParts(plate);
  return (
    <span className={`uz-plate uz-plate-${size}`} role="img" aria-label={formatPlate(plate)}>
      <span className="uz-plate-region">{region}</span>
      <span className="uz-plate-number">{number}</span>
      <PlateCountry />
    </span>
  );
}
