import {
  CAR_CATALOG,
  CAR_COLORS,
  CAR_YEAR_MIN,
  carSchema,
  MAX_SEATS,
  type CarColor,
} from '@platform/contracts';
import type { TranslationKey } from '@platform/i18n';
import type { Choice } from './steps/choice-step';

type Translate = (key: TranslationKey) => string;

export const makeChoices = (): Choice<string>[] =>
  Object.keys(CAR_CATALOG).map((make) => ({ value: make, label: make }));

export const modelChoices = (make: string | undefined): Choice<string>[] =>
  (CAR_CATALOG[make ?? ''] ?? []).map((model) => ({ value: model, label: model }));

export const colorChoices = (t: Translate): Choice<CarColor>[] =>
  CAR_COLORS.map((color) => ({ value: color, label: t(`drivers.color.${color}`) }));

// The newest cars first: most drivers find their year without scrolling.
export function yearChoices(now = new Date()): Choice<number>[] {
  const years: Choice<number>[] = [];
  for (let year = now.getFullYear(); year >= CAR_YEAR_MIN; year -= 1)
    years.push({ value: year, label: String(year) });
  return years;
}

export const seatChoices = (): Choice<number>[] =>
  Array.from({ length: MAX_SEATS }, (_, index) => ({ value: index + 1, label: String(index + 1) }));

// A name typed after "Boshqa": the same rule as the server (letters, digits, 2 … 32).
export const carName = (text: string): string | null => {
  const parsed = carSchema.shape.make.safeParse(text);
  return parsed.success ? parsed.data : null;
};
