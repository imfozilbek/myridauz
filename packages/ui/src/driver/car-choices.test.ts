import { CAR_CATALOG, catalogSeats, MAX_SEATS, POPULAR_CARS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { carLabel, findCars, seatLimit, seatsOf, typedCar } from './car-choices';

describe('the car catalog: seats by the model (docs/50, G62)', () => {
  it('has seats for every model within the limit, and only listed popular cars', () => {
    for (const models of Object.values(CAR_CATALOG)) {
      for (const seats of Object.values(models)) {
        expect(seats).toBeGreaterThan(0);
        expect(seats).toBeLessThanOrEqual(MAX_SEATS);
      }
    }
    for (const car of POPULAR_CARS) expect(catalogSeats(car.make, car.model)).toBeDefined();
    expect(POPULAR_CARS.map((car) => car.model)).toContain('Malibu');
  });

  it('gives a listed model its seats as the limit, a typed one 4 seats up to the app limit', () => {
    expect(seatsOf({ make: 'Chevrolet', model: 'Damas' })).toBe(6);
    expect(seatLimit({ make: 'Chevrolet', model: 'Damas' })).toBe(6);
    expect(seatsOf({ make: 'Isuzu', model: 'Grafter' })).toBe(4);
    expect(seatLimit({ make: 'Isuzu', model: 'Grafter' })).toBe(MAX_SEATS);
  });

  it('finds cars by any part of the make or the model, whatever the letter case', () => {
    expect(findCars('sor')).toEqual([{ make: 'Kia', model: 'Sorento' }]);
    expect(findCars('KIA').every((car) => car.make === 'Kia')).toBe(true);
    expect(findCars('chevrolet nex')).toEqual([{ make: 'Chevrolet', model: 'Nexia' }]);
    expect(findCars('').length).toBeGreaterThan(POPULAR_CARS.length);
  });

  it('takes a typed car only with its make and model', () => {
    expect(typedCar('Isuzu  Grafter')).toEqual({ make: 'Isuzu', model: 'Grafter' });
    expect(typedCar(' GAZ Gazel Next ')).toEqual({ make: 'GAZ', model: 'Gazel Next' });
    expect(typedCar('Grafter')).toBeNull();
    expect(typedCar('Isuzu !!')).toBeNull();
  });

  it('names a chip by the model, a typed car by the make and the model', () => {
    expect(carLabel({ make: 'Kia', model: 'Sorento' })).toBe('Sorento');
    expect(carLabel({ make: 'Isuzu', model: 'Grafter' })).toBe('Isuzu Grafter');
  });
});
