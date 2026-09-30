import {
  CAR_CATALOG,
  CAR_COLORS,
  carSchema,
  catalogSeats,
  MAX_SEATS,
  POPULAR_CARS,
  type CarColor,
  type CarInput,
} from '@platform/contracts';
import type { ReactNode } from 'react';
import type { useI18n } from '../context/i18n-context';
import type { Choice } from './steps/choice-step';

type Translate = ReturnType<typeof useI18n>['t'];
type Car = Partial<CarInput>;

// "4 ta joy" next to a model: the driver sees the seats the car gets (owner decision 30.09.2026).
const seatsLabel = (t: Translate, seats: number) => t('drivers.seats.count', { seats });

export const popularChoices = (t: Translate): Choice<{ make: string; model: string }>[] =>
  POPULAR_CARS.map((car) => ({
    value: car,
    label: `${car.make} ${car.model}`,
    after: seatsLabel(t, catalogSeats(car.make, car.model) ?? 0),
  }));

export const makeChoices = (): Choice<string>[] =>
  Object.keys(CAR_CATALOG).map((make) => ({ value: make, label: make }));

export const modelChoices = (t: Translate, make: string | undefined): Choice<string>[] =>
  Object.entries(CAR_CATALOG[make ?? ''] ?? {}).map(([model, seats]) => ({
    value: model,
    label: model,
    after: seatsLabel(t, seats),
  }));

export const colorChoices = (t: Translate, swatch: (color: CarColor) => ReactNode): Choice<CarColor>[] =>
  CAR_COLORS.map((color) => ({ value: color, label: t(`drivers.color.${color}`), before: swatch(color) }));

// A model from the list brings its seats; a model typed after "Boshqa" needs the answer of the driver.
export const modelSeats = (make: string | undefined, model: string): Car => {
  const seats = catalogSeats(make ?? '', model);
  return seats === undefined ? {} : { seats };
};
export const asksSeats = (car: Car): boolean => catalogSeats(car.make ?? '', car.model ?? '') === undefined;

// Most cars take 4 passengers: the answer is ready for a typed model, the driver may change it.
export const USUAL_SEATS = 4;

export const seatChoices = (): Choice<number>[] =>
  Array.from({ length: MAX_SEATS }, (_, index) => ({ value: index + 1, label: String(index + 1) }));

// A name typed after "Boshqa": the same rule as the server (letters, digits, 2 … 32).
export const carName = (text: string): string | null => {
  const parsed = carSchema.shape.make.safeParse(text);
  return parsed.success ? parsed.data : null;
};
