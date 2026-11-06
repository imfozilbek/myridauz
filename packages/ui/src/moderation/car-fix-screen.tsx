import './moderation.css';
import { carSchema, formatPlate, type ApplicationSummary, type CarInput } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../account/step-layout';
import { useScreenView } from '../context/analytics-context';
import { useApiClients } from '../context/api-clients';
import { useBrand } from '../context/brand-context';
import { useI18n } from '../context/i18n-context';
import { seatsOf, type CarName } from '../driver/car-choices';
import { ColorDots } from '../driver/car-form/color-dots';
import { ModelChips } from '../driver/car-form/model-chips';
import { OtherCarSheet } from '../driver/car-form/other-car-sheet';
import { useBlobUrl } from '../media/use-blob-url';
import { UzPlateInput } from '../plate/uz-plate-input';
import { Screen } from '../screen/screen';
import { MainButton } from '../telegram/bottom-button';
import { brandVars } from '../theme/brand-vars';
import '../driver/car-form/car-form.css';

type Props = {
  readonly application: ApplicationSummary;
  readonly onBack: () => void;
  readonly onSave: (car: CarInput) => void;
};

const same = (one: CarInput, other: CarInput) => JSON.stringify(one) === JSON.stringify(other);

// «Mashinani tuzatish» (G95, docs/224): the front photo on top, under it the model, the color and the
// plate the driver gave; the team fixes what the photo shows. The seats follow a new model.
export function CarFixScreen({ application, onBack, onSave }: Props) {
  useScreenView('moderation.car_fix');
  const { t } = useI18n();
  const { moderation } = useApiClients();
  const { colors } = useBrand().theme;
  const { userId, car: given } = application;
  const [car, setCar] = useState<CarInput>(given);
  const [other, setOther] = useState(false);
  const photo = useBlobUrl(() => moderation.photo(userId, 'front'), `${userId}:front`);
  const pick = (name: CarName) => {
    setOther(false);
    setCar((was) => ({ ...was, ...name, seats: seatsOf(name) }));
  };
  const ready = carSchema.safeParse(car).success && !same(car, given);
  return (
    <div className="car-screen" style={brandVars(colors)}>
      <StepLayout icon="car" title={t('moderation.fixCar')} hint={t('moderation.fixCar.hint')}>
        <Screen onBack={onBack} />
        {/* The place of the photo is kept while it loads: the form never jumps (G41). */}
        {photo ? (
          <img className="plate-check-photo" src={photo} alt={t('drivers.photo.front')} />
        ) : (
          <span className="plate-check-photo moderation-photo-empty" />
        )}
        <div className="car-form">
          <span className="car-label">{t('drivers.car.model')}</span>
          <ModelChips car={car} onPick={pick} onOther={() => setOther(true)} />
          <span className="car-label">
            {t('drivers.car.colorChosen', { color: t(`drivers.color.${car.color}`) })}
          </span>
          <ColorDots value={car.color} onPick={(color) => setCar((was) => ({ ...was, color }))} />
          <span className="car-label">{t('drivers.plate.title')}</span>
          <UzPlateInput
            value={formatPlate(car.plate)}
            label={t('drivers.plate.title')}
            problem={false}
            onChange={(plate) => setCar((was) => ({ ...was, plate }))}
          />
        </div>
        <OtherCarSheet open={other} onClose={() => setOther(false)} onPick={pick} />
        <MainButton text={t('moderation.fixCar.save')} disabled={!ready} onClick={() => onSave(car)} />
      </StepLayout>
    </div>
  );
}
