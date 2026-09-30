import type { CarInput, DriverStep } from '@platform/contracts';
import { useI18n } from '../context/i18n-context';
import { CarSwatch } from './car-swatch';
import {
  carName,
  colorChoices,
  makeChoices,
  modelChoices,
  presetSeats,
  seatChoices,
  seatsOf,
} from './car-choices';
import { ChoiceStep } from './steps/choice-step';

export type CarStepName = 'make' | 'model' | 'color' | 'seats';

type CarStepProps = {
  readonly step: CarStepName;
  readonly car: Partial<CarInput>;
  readonly onBack: () => void;
  readonly onDone: (patch: Partial<CarInput>, passed?: DriverStep) => void;
};

// The car questions that are answered by one tap: make, model, color, seats.
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
          choices={modelChoices(car.make)}
          other={{ toValue: carName }}
          onDone={(model) => onDone({ model, ...presetSeats(car, model) }, 'car')}
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
          selected={car.seats ?? seatsOf(car.model)}
          onDone={(seats) => onDone({ seats }, 'seats')}
        />
      );
  }
}
