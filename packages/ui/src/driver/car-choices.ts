import {
  CAR_CATALOG,
  CAR_COLORS,
  CAR_SEATS,
  carSchema,
  MAX_SEATS,
  type CarColor,
  type CarInput,
} from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import type { ReactNode } from 'react';
import type { Choice } from './steps/choice-step';

type Translate = (key: TranslationKey) => string;

export const makeChoices = (): Choice<string>[] =>
  Object.keys(CAR_CATALOG).map((make) => ({ value: make, label: make }));

export const modelChoices = (make: string | undefined): Choice<string>[] =>
  (CAR_CATALOG[make ?? ''] ?? []).map((model) => ({ value: model, label: model }));

export const colorChoices = (t: Translate, swatch: (color: CarColor) => ReactNode): Choice<CarColor>[] =>
  CAR_COLORS.map((color) => ({ value: color, label: t(`drivers.color.${color}`), before: swatch(color) }));

// Most cars take 4 passengers. The answer is ready for the chosen model, the driver may change it (docs/35).
const USUAL_SEATS = 4;
export const seatsOf = (model: string | undefined): number => CAR_SEATS[model ?? ''] ?? USUAL_SEATS;

// A new model brings its seats, unless the driver has already changed the ready answer.
export const presetSeats = (car: Partial<CarInput>, model: string): Partial<CarInput> =>
  car.seats === undefined || car.seats === seatsOf(car.model) ? { seats: seatsOf(model) } : {};

export const seatChoices = (): Choice<number>[] =>
  Array.from({ length: MAX_SEATS }, (_, index) => ({ value: index + 1, label: String(index + 1) }));

// A name typed after "Boshqa": the same rule as the server (letters, digits, 2 … 32).
export const carName = (text: string): string | null => {
  const parsed = carSchema.shape.make.safeParse(text);
  return parsed.success ? parsed.data : null;
};
