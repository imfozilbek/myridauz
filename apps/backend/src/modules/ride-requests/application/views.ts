import type { RideRequest } from '@platform/contracts';
import { statusAt, type RequestRecord } from '../domain/ride-request';
import type { RequestsDeps } from './ports';

// Other people see only the name and the face of the passenger (docs/07).
export async function views(deps: RequestsDeps, requests: readonly RequestRecord[]): Promise<RideRequest[]> {
  const now = deps.now();
  const found = await Promise.all(
    requests.map(async (request) => {
      const person = await deps.people.find(request.passengerId);
      if (!person) return null;
      const passenger = {
        id: person.publicId,
        firstName: person.firstName,
        hasAvatar: person.avatarShown,
      };
      const { id, from, to, date, km, seats, price, pickupMode, wholeCar, withWoman } = request;
      const status = statusAt(request, now);
      return { id, passenger, from, to, date, km, seats, price, pickupMode, wholeCar, withWoman, status };
    }),
  );
  return found.filter((request) => request !== null);
}
