import type { Car, Trip } from '@platform/contracts';
import type { Person } from '../../users';
import { statusAt, type TripRecord } from '../domain/trip';

// What other people see of a trip: the driver's name, face and car, never the plate (docs/07).
export function tripView(trip: TripRecord, driver: Person, car: Car, now: number): Trip {
  return {
    id: trip.id,
    driver: {
      id: driver.id,
      firstName: driver.firstName,
      hasAvatar: driver.avatarKey !== null,
      car: { make: car.make, model: car.model, color: car.color },
    },
    from: trip.from,
    to: trip.to,
    departAt: trip.departAt,
    km: trip.km,
    seats: trip.seats,
    price: trip.price,
    // A woman driver or a woman the driver takes along (docs/06). Bookings add more in G08.
    woman: driver.gender === 'female' || trip.womanOnBoard,
    hasMeetingPoint: trip.meetingPoint !== null,
    comment: trip.comment,
    status: statusAt(trip, now),
  };
}
