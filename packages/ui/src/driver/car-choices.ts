import { CAR_CATALOG, CAR_COLORS, carSchema, MAX_SEATS, type CarColor } from '@platform/contracts';
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

// Most cars take 4 passengers: the answer is ready, a driver of a minivan changes it (docs/35).
export const DEFAULT_SEATS = 4;

export const seatChoices = (): Choice<number>[] =>
  Array.from({ length: MAX_SEATS }, (_, index) => ({ value: index + 1, label: String(index + 1) }));

// A name typed after "Boshqa": the same rule as the server (letters, digits, 2 … 32).
export const carName = (text: string): string | null => {
  const parsed = carSchema.shape.make.safeParse(text);
  return parsed.success ? parsed.data : null;
};
