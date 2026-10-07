import type { BookingInput, Trip } from '@platform/contracts';

type Choice = Pick<BookingInput, 'seats' | 'wholeCar' | 'withWoman'>;
type TripFacts = Pick<Trip, 'seats' | 'seatsLeft' | 'bookingRule' | 'woman'>;
export type ChoiceError = 'bookings.invalid_input' | 'bookings.no_seats';

// The whole car (owner decision 06.10.2026, docs/09, docs/118): only on a trip that allows it,
// only while nobody rides, and it takes every seat. A trip of «Faqat butun salon» takes nothing else.
export function seatChoiceError(trip: TripFacts, choice: Choice): ChoiceError | null {
  if (!choice.wholeCar) return trip.bookingRule === 'car_only' ? 'bookings.invalid_input' : null;
  if (trip.bookingRule === 'seats' || choice.seats !== trip.seats) return 'bookings.invalid_input';
  return trip.seatsLeft === trip.seats ? null : 'bookings.no_seats';
}

// «Men bilan ayol bor» (docs/06 rule 4): a man with 2 seats and more on a trip without the mark yet.
// For anyone else it means nothing and is not kept: a woman gives the mark by herself.
export const keepsWithWoman = (trip: TripFacts, choice: Choice, passengerIsWoman: boolean) =>
  choice.withWoman === true && choice.seats >= 2 && !trip.woman && !passengerIsWoman;
