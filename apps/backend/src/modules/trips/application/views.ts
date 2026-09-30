import { NO_RATING, type Car, type Rating, type Trip } from '@platform/contracts';
import type { Person } from '../../users';
import { statusAt, type TripRecord } from '../domain/trip';

// Seats taken by confirmed bookings and whether a woman is among the passengers (G08).
export type Riders = { readonly seats: number; readonly woman: boolean };
export const NO_RIDERS: Riders = { seats: 0, woman: false };

// What other people see of a trip: the driver's name, face and car, never the plate (docs/07).
export function tripView(
  trip: TripRecord,
  driver: Person,
  car: Car,
  now: number,
  riders: Riders,
  rating: Rating = NO_RATING,
  recommendedPrice: number | null = null,
): Trip {
  const seatsLeft = Math.max(0, trip.seats - riders.seats);
  const status = statusAt(trip, now);
  return {
    id: trip.id,
    driver: {
      id: driver.id,
      firstName: driver.firstName,
      hasAvatar: driver.avatarKey !== null,
      car: { make: car.make, model: car.model, color: car.color },
      rating,
    },
    from: trip.from,
    to: trip.to,
    departAt: trip.departAt,
    km: trip.km,
    seats: trip.seats,
    seatsLeft,
    price: trip.price,
    recommendedPrice,
    // The 3 rules of docs/06: a woman driver, a woman the driver takes along, a woman with a
    // confirmed booking. Only the fact, no name.
    woman: driver.gender === 'female' || trip.womanOnBoard || riders.woman,
    hasMeetingPoint: trip.meetingPoint !== null,
    comment: trip.comment,
    status: status === 'active' && seatsLeft === 0 ? 'full' : status,
  };
}
