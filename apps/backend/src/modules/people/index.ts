import { ACTIVITY_ROWS, type PersonActivity } from '@platform/contracts';
import type { Bindings } from '../../env';
import { cancelsOf, passengerRideCount, ridesOfPerson } from '../bookings';
import { complaintsAgainst, complaintsListAgainst } from '../complaints';
import { approvedCar } from '../drivers';
import { ratingsOfPeople } from '../ratings';
import { driverTripIds, latestTripsOf } from '../trips';
import { blockOf, joinedAtOf, peopleOf } from '../users';
import { personRoutes } from './http/person-routes';

// The newest trips, seats and complaints of a person and the seats cancelled after a «yes» (G45).
async function activity(env: Bindings, userId: number): Promise<PersonActivity> {
  const [trips, rides, complaints, cancels] = await Promise.all([
    latestTripsOf(env, userId, ACTIVITY_ROWS),
    ridesOfPerson(env, userId, ACTIVITY_ROWS),
    complaintsListAgainst(env, userId, ACTIVITY_ROWS),
    cancelsOf(env, userId),
  ]);
  return {
    trips: trips.map(({ id, from, to, departAt, status }) => ({ id, from, to, departAt, status })),
    rides,
    complaints: complaints.map(({ id, reasons, status, createdAt }) => ({
      id,
      reasons: [...reasons],
      status,
      at: createdAt,
    })),
    cancels,
  };
}

// «Odamlar» of the owner (G75, G45 in G67): one person put together from the modules that hold it.
export const peopleModule = personRoutes({
  idOf: (env, publicId) => peopleOf(env).idOf(publicId),
  activity,
  card: async (env, userId, publicId) => {
    const person = await peopleOf(env).find(userId);
    if (!person) return undefined;
    const [joinedAt, ratings, trips, rides, complaints, car, block] = await Promise.all([
      joinedAtOf(env, userId),
      ratingsOfPeople(env, [userId]),
      driverTripIds(env, userId),
      passengerRideCount(env, userId),
      complaintsAgainst(env, userId),
      approvedCar(env, userId),
      blockOf(env, userId),
    ]);
    const rating = ratings.get(userId);
    return {
      id: publicId,
      firstName: person.firstName,
      hasAvatar: person.avatarShown,
      joinedAt: joinedAt ?? null,
      rating: { average: rating?.average ?? null, count: rating?.count ?? 0 },
      trips: trips.length,
      rides,
      complaintsAgainst: complaints,
      car: car ? { make: car.make, model: car.model, plate: car.plate } : null,
      blocked: block !== null,
      blockedUntil: block?.until ?? null,
    };
  },
});
