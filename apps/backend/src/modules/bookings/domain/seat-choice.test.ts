import { describe, expect, it } from 'vitest';
import { keepsWithWoman, seatChoiceError } from './seat-choice';

const trip = { seats: 4, seatsLeft: 4, bookingRule: 'seats_or_car', woman: false } as const;

describe('the whole car (G59, docs/09)', () => {
  it('a trip of seats only takes no whole car', () => {
    expect(seatChoiceError({ ...trip, bookingRule: 'seats' }, { seats: 4, wholeCar: true })).toBe(
      'bookings.invalid_input',
    );
  });

  it('the whole car takes every seat of the trip', () => {
    expect(seatChoiceError(trip, { seats: 4, wholeCar: true })).toBeNull();
    expect(seatChoiceError(trip, { seats: 3, wholeCar: true })).toBe('bookings.invalid_input');
  });

  it('nobody may ride yet', () => {
    expect(seatChoiceError({ ...trip, seatsLeft: 3 }, { seats: 4, wholeCar: true })).toBe(
      'bookings.no_seats',
    );
  });

  it('«Faqat butun salon» takes no seats alone', () => {
    const only = { ...trip, bookingRule: 'car_only' } as const;
    expect(seatChoiceError(only, { seats: 2, wholeCar: false })).toBe('bookings.invalid_input');
    expect(seatChoiceError(only, { seats: 4, wholeCar: true })).toBeNull();
  });

  it('seats as before on the other trips', () => {
    expect(seatChoiceError(trip, { seats: 2 })).toBeNull();
  });
});

describe('«Men bilan ayol bor» (docs/06 rule 4)', () => {
  it('a man with 2 seats on a trip without the mark keeps it', () => {
    expect(keepsWithWoman(trip, { seats: 2, withWoman: true }, false)).toBe(true);
  });

  it('not with 1 seat, not on a trip with the mark, not from a woman', () => {
    expect(keepsWithWoman(trip, { seats: 1, withWoman: true }, false)).toBe(false);
    expect(keepsWithWoman({ ...trip, woman: true }, { seats: 2, withWoman: true }, false)).toBe(false);
    expect(keepsWithWoman(trip, { seats: 2, withWoman: true }, true)).toBe(false);
  });
});
