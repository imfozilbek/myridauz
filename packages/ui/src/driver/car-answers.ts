import type { CarInput } from '@platform/contracts';
import { useState } from 'react';

const FIELDS = ['make', 'model', 'color', 'plate', 'seats'] as const;

// The car of the application. A make changed from the list waits for its model (docs/94 B5):
// «Назад» on the model drops the new make, so the car never pairs a new make with the old model.
export function useCarAnswers(initial: Partial<CarInput> | undefined) {
  const [car, setCar] = useState<Partial<CarInput>>(initial ?? {});
  const [make, setMake] = useState<string | null>(null);
  const shown = make === null ? car : { ...car, make };
  // A make alone is kept aside; with its model (or a popular car) it joins the car.
  const answer = (patch: Partial<CarInput>, alone: boolean) => {
    if (alone) {
      setMake(patch.make ?? null);
      return shown;
    }
    const next = { ...shown, ...patch };
    setMake(null);
    setCar(next);
    return next;
  };
  const dropMake = () => setMake(null);
  // Typed or chosen data that is not sent yet: leaving asks first (docs/94 F3).
  const dirty = make !== null || FIELDS.some((field) => car[field] !== initial?.[field]);
  return { car, shown, answer, dropMake, dirty };
}
