import { carSchema, formatPlate, type CarInput, type ModerationReason } from '@platform/contracts';
import { useState } from 'react';
import { StepLayout } from '../../account/step-layout';
import { useScreenView } from '../../context/analytics-context';
import { useBrand } from '../../context/brand-context';
import { useI18n } from '../../context/i18n-context';
import { Stepper } from '../../find/stepper';
import { UzPlateInput } from '../../plate/uz-plate-input';
import { Screen } from '../../screen/screen';
import { MainButton } from '../../telegram/bottom-button';
import { haptic } from '../../telegram/feedback';
import { brandVars } from '../../theme/brand-vars';
import { seatLimit, seatsOf, type CarName } from '../car-choices';
import { hasProblem, ProblemNote } from '../problem-note';
import { ColorDots } from './color-dots';
import { ModelChips } from './model-chips';
import { OtherCarSheet } from './other-car-sheet';
import '../../find/seats.css';
import './car-form.css';

type Props = {
  readonly car: Partial<CarInput>;
  readonly reasons: readonly ModerationReason[];
  readonly onChange: (patch: Partial<CarInput>) => void;
  readonly onBack: () => void;
  readonly onDone: () => void;
};

// «Mashinangiz» (G62, mockup g62/1 screen 2, variant A): the model, the color, the plate and the seats
// on one screen; «Davom etish» waits for the whole car.
export function CarScreen({ car, reasons, onChange, onBack, onDone }: Props) {
  useScreenView('driver.car');
  const { t } = useI18n();
  const { colors } = useBrand().theme;
  const [other, setOther] = useState(false);
  const pick = (name: CarName) => {
    setOther(false);
    onChange({ ...name, seats: seatsOf(name) });
  };
  const seats = car.seats ?? 0;
  return (
    <div className="car-screen" style={brandVars(colors)}>
      <StepLayout steps={[1, 2]} title={t('drivers.car.title')} hint={t('drivers.car.step')}>
        <Screen onBack={onBack} />
        <div className="car-form">
          <span className="car-label">{t('drivers.car.model')}</span>
          <ModelChips car={car} onPick={pick} onOther={() => setOther(true)} />
          <ProblemNote reasons={reasons} place="car" />
          <span className="car-label">
            {car.color
              ? t('drivers.car.colorChosen', { color: t(`drivers.color.${car.color}`) })
              : t('drivers.car.color')}
          </span>
          <ColorDots value={car.color} onPick={(color) => onChange({ color })} />
          <span className="car-label">{t('drivers.plate.title')}</span>
          <UzPlateInput
            value={formatPlate(car.plate ?? '')}
            label={t('drivers.plate.title')}
            problem={hasProblem(reasons, 'plate')}
            onChange={(plate) => onChange({ plate })}
          />
          <ProblemNote reasons={reasons} place="plate" />
          {seats > 0 ? (
            <div className="points-card seats-card car-seats">
              <div className="seats-row">
                <span>{t('drivers.car.seats')}</span>
                <Stepper
                  value={seats}
                  atLeast={seats <= 1}
                  atMost={seats >= seatLimit(car)}
                  onStep={(by) => {
                    haptic.select();
                    onChange({ seats: seats + by });
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>
        <OtherCarSheet open={other} onClose={() => setOther(false)} onPick={pick} />
        <MainButton
          text={t('common.continue')}
          disabled={!carSchema.safeParse(car).success}
          onClick={onDone}
        />
      </StepLayout>
    </div>
  );
}
