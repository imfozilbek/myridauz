import { NO_RATING, type RideRequest } from '@platform/contracts';
import { statusAt, type RequestRecord } from '../domain/ride-request';
import type { RequestsDeps } from './ports';

// Other people see only the name and the face of the passenger (docs/07).
export async function views(deps: RequestsDeps, requests: readonly RequestRecord[]): Promise<RideRequest[]> {
  const now = deps.now();
  const ratings = await deps.ratings([...new Set(requests.map((request) => request.passengerId))]);
  const found = await Promise.all(
    requests.map(async (request) => {
      const person = await deps.people.find(request.passengerId);
      if (!person) return null;
      const passenger = {
        id: person.publicId,
        firstName: person.firstName,
        hasAvatar: person.avatarShown,
        rating: ratings.get(request.passengerId) ?? NO_RATING,
      };
      const { id, from, to, date, km, seats, price, pickupMode, wholeCar, withWoman, callsOff } = request;
      const status = statusAt(request, now);
      const marks = { pickupMode, wholeCar, withWoman, callsOff };
      return { id, passenger, from, to, date, km, seats, price, ...marks, status };
    }),
  );
  return found.filter((request) => request !== null);
}
