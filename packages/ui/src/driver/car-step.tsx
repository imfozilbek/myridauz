import type { CarInput, DriverStep } from '@platform/contracts';
import { CellValue } from '../account/cell-value';
import { Cell, Section } from '../components';
import { useI18n } from '../context/i18n-context';
import { haptic } from '../telegram/feedback';
import { CarSwatch } from './car-swatch';
import {
  carName,
  colorChoices,
  makeChoices,
  modelChoices,
  modelSeats,
  popularChoices,
  seatChoices,
  USUAL_SEATS,
} from './car-choices';
import { ChoiceStep } from './steps/choice-step';

export type CarStepName = 'make' | 'model' | 'color' | 'seats';

type CarStepProps = {
  readonly step: CarStepName;
  readonly car: Partial<CarInput>;
  readonly onBack: () => void;
  // The next screen follows the answer; a popular car answers make and model at once.
  readonly onDone: (patch: Partial<CarInput>, passed?: DriverStep) => void;
};

// The car questions that are answered by one tap: make, model, color, seats (docs/50).
export function CarStep({ step, car, onBack, onDone }: CarStepProps) {
  const { t } = useI18n();
  const common = { screen: `driver.${step}`, onBack } as const;
  switch (step) {
    case 'make':
      return (
        <ChoiceStep
          {...common}
          icon="car"
          title={t('drivers.make.title')}
          lead={
            <Section header={t('drivers.make.popular')}>
              {popularChoices(t).map((choice) => (
                <Cell
                  key={choice.label}
                  after={<CellValue>{choice.after ?? ''}</CellValue>}
                  onClick={() => {
                    haptic.tap();
                    onDone({ ...choice.value, ...modelSeats(choice.value.make, choice.value.model) }, 'car');
                  }}
                >
                  {choice.label}
                </Cell>
              ))}
            </Section>
          }
          header={t('drivers.make.all')}
          choices={makeChoices()}
          other={{ toValue: carName }}
          onDone={(make) => onDone({ make })}
        />
      );
    case 'model':
      return (
        <ChoiceStep
          {...common}
          icon="car"
          title={t('drivers.model.title')}
          choices={modelChoices(t, car.make)}
          other={{ toValue: carName }}
          onDone={(model) => onDone({ model, ...modelSeats(car.make, model) }, 'car')}
        />
      );
    case 'color':
      return (
        <ChoiceStep
          {...common}
          icon="car"
          title={t('drivers.color.title')}
          choices={colorChoices(t, (color) => (
            <CarSwatch color={color} />
          ))}
          onDone={(color) => onDone({ color }, 'color')}
        />
      );
    default:
      return (
        <ChoiceStep
          {...common}
          icon="passengers"
          title={t('drivers.seats.title')}
          choices={seatChoices()}
          selected={car.seats ?? USUAL_SEATS}
          onDone={(seats) => onDone({ seats }, 'seats')}
        />
      );
  }
}
