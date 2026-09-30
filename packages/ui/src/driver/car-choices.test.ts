import { CAR_CATALOG, catalogSeats, MAX_SEATS, POPULAR_CARS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { nextStep, previousStep } from './application-steps';
import { asksSeats, modelSeats } from './car-choices';

describe('the car catalog: seats by the model (docs/50)', () => {
  it('has seats for every model within the limit, and only listed popular cars', () => {
    for (const models of Object.values(CAR_CATALOG)) {
      for (const seats of Object.values(models)) {
        expect(seats).toBeGreaterThan(0);
        expect(seats).toBeLessThanOrEqual(MAX_SEATS);
      }
    }
    for (const car of POPULAR_CARS) expect(catalogSeats(car.make, car.model)).toBeDefined();
  });

  it('gives a listed model its seats and asks seats only for a typed model', () => {
    expect(modelSeats('Chevrolet', 'Damas')).toEqual({ seats: 6 });
    expect(modelSeats('Isuzu', 'Grafter')).toEqual({});
    expect(asksSeats({ make: 'Chevrolet', model: 'Cobalt' })).toBe(false);
    expect(asksSeats({ make: 'Chevrolet', model: 'Matiz Best' })).toBe(true);
  });

  it('skips the seats screen for a listed model and the model screen for a popular car', () => {
    const cobalt = { make: 'Chevrolet', model: 'Cobalt', seats: 4 };
    const typed = { make: 'Isuzu', model: 'Grafter' };
    expect(nextStep('make', cobalt, true, false)).toBe('color');
    expect(nextStep('make', { make: 'Kia' }, false, false)).toBe('model');
    expect(nextStep('plate', cobalt, false, false)).toBe('avatar');
    expect(nextStep('plate', typed, false, false)).toBe('seats');
    expect(previousStep('avatar', cobalt)).toBe('plate');
    expect(previousStep('avatar', typed)).toBe('seats');
    // On the review a typed model still gets its seats question.
    expect(nextStep('model', typed, true, true)).toBe('seats');
    expect(nextStep('model', cobalt, true, true)).toBe('review');
    expect(nextStep('make', cobalt, true, true)).toBe('review');
  });
});
