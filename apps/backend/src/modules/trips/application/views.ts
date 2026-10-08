import { NO_RATING, type Pitak, type Rating, type Trip } from '@platform/contracts';
import type { Person } from '../../users';
import { statusAt, type TripCar, type TripRecord } from '../domain/trip';

// Seats taken by confirmed bookings and whether a woman is among the passengers (G08): a woman, or a
// man who said «Men bilan ayol bor» (docs/06 rule 4).
export const NO_RIDERS: Riders = { seats: 0, woman: false };

export type Riders = { readonly seats: number; readonly woman: boolean };

// What other people see of a trip: the driver's name, face, car and plate (G59), never a phone (docs/07).
export function tripView(
  trip: TripRecord,
  driver: Person,
  car: TripCar,
  now: number,
  riders: Riders,
  rating: Rating = NO_RATING,
  recommendedPrice: number | null = null,
  pitak: Pitak | null = null,
): Trip {
  const seatsLeft = Math.max(0, trip.seats - riders.seats);
  const status = statusAt(trip, now);
  return {
    id: trip.id,
    driver: {
      id: driver.publicId,
      firstName: driver.firstName,
      hasAvatar: driver.avatarShown,
      car: { make: car.make, model: car.model, color: car.color, plate: car.plate },
      rating,
    },
    from: trip.from,
    to: trip.to,
    departAt: trip.departAt,
    km: trip.km,
    seats: trip.seats,
    seatsLeft,
    price: trip.price,
    firstDepartAt: trip.firstDepartAt,
    firstPrice: trip.firstPrice,
    recommendedPrice,
    // The rules of docs/06: a woman driver, a woman the driver takes along, a woman with a confirmed
    // booking or a confirmed «Men bilan ayol bor». Only the fact, no name.
    woman: driver.gender === 'female' || trip.womanOnBoard || riders.woman,
    pickupMode: trip.pickupMode,
    bookingRule: trip.bookingRule,
    // A driver who takes people only around the city has no pitak to show.
    pitak: trip.pickupMode === 'door' ? null : pitak,
    comment: trip.comment,
    status: status === 'active' && seatsLeft === 0 ? 'full' : status,
    departedAt: trip.departedAt,
    arrivedAt: trip.arrivedAt,
  };
}
