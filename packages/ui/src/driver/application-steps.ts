import type { CarInput } from '@platform/contracts';
import { asksSeats } from './car-choices';

// The screens of the application, one question each (docs/04, docs/50). The face and the car
// photos share one screen (G34).
const ORDER = ['make', 'model', 'color', 'plate', 'seats', 'photos', 'review'] as const;
export type Step = (typeof ORDER)[number];

export const isStep = (value: unknown): value is Step => ORDER.some((step) => step === value);

// Where the application is: the bar on top of each screen (docs/88 L4).
export const progressOf = (step: Step) => [ORDER.indexOf(step), ORDER.length] as const;

// Seats are asked only for a model typed after "Boshqa": a model from the list has its seats.
const shown = (step: Step, car: Partial<CarInput>) => step !== 'seats' || asksSeats(car);

// The screen after an answer. A make from the list asks its model; a popular car answers both at once.
export function nextStep(
  current: Step,
  car: Partial<CarInput>,
  withModel: boolean,
  reviewing: boolean,
): Step {
  if (current === 'make' && !withModel) return 'model';
  if (reviewing) return current === 'model' && asksSeats(car) ? 'seats' : 'review';
  const from = current === 'make' ? ORDER.indexOf('model') : ORDER.indexOf(current);
  return ORDER.slice(from + 1).find((step) => shown(step, car)) ?? 'review';
}

// null: the first step, «Назад» leaves the application for the main screen (G34).
export function previousStep(current: Step, car: Partial<CarInput>): Step | null {
  const before = ORDER.slice(0, ORDER.indexOf(current)).filter((step) => shown(step, car));
  return before.at(-1) ?? null;
}
