import type { Car } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { UzPlate } from '../plate/uz-plate';
import { carLabel } from './car-choices';

type Props = { readonly car: Car; readonly onChange: () => void };

// The car above its photos (G62, mockup g62/1 screen 3): the model, the color, the seats and the
// plate, with «Oʻzgartirish» back to the car.
export function CarHead({ car, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="car-head">
      <b className="car-head-name">
        {t('drivers.car.summary', {
          model: carLabel(car),
          color: t(`drivers.color.${car.color}`),
          seats: String(car.seats),
        })}
      </b>
      <UzPlate plate={car.plate} size="s" />
      <button type="button" className="car-head-change" onClick={onChange}>
        {t('drivers.car.change')}
      </button>
    </div>
  );
}
