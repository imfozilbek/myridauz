import type { Trip } from '@platform/contracts';

// What the passenger chose on «Safar» (G59): the seats, the whole car (docs/09) and
// «Men bilan ayol bor» (docs/06 rule 4). The booking takes it as it is.
export type SeatChoice = { readonly seats: number; readonly wholeCar: boolean; readonly withWoman: boolean };

// The first choice: one seat, or the whole car where the trip sells only the whole car.
export const firstChoice = (trip: Trip): SeatChoice =>
  trip.bookingRule === 'car_only'
    ? { seats: trip.seats, wholeCar: true, withWoman: false }
    : { seats: 1, wholeCar: false, withWoman: false };

// «Men bilan ayol bor» is offered to a man with 2 seats and more on a trip without the mark yet.
export const offersWoman = (trip: Trip, choice: SeatChoice, isMan: boolean) =>
  isMan && !choice.wholeCar && choice.seats >= 2 && !trip.woman;
