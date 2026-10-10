// Test helper: the drivers module over memory, one person «Ali» (docs/04).
import type { Car } from '@platform/contracts';
import { createMemoryImages } from '../../shared/storage/memory-images';
import { uploadCarPhoto } from './application/apply';
import type { DriversDeps, Person } from './application/ports';
import { createMemoryApplications, createMemoryDecisions } from './infrastructure/memory-applications';
import { idOfPublic, publicIdOf } from '../../test-people';

export const CAR: Car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  plate: '01A123BC',
  seats: 4,
};
export const jpeg = { body: new ArrayBuffer(10), type: 'image/jpeg' };

export function setup(avatarKey: string | null = 'avatars/1/a') {
  // A trip of the driver that is not over yet (G75): the car does not change under it.
  let liveTrips = false;
  const persons = new Map<number, Person>([
    [1, { id: 1, publicId: publicIdOf(1), firstName: 'Ali', avatarKey, gender: 'male' }],
  ]);
  const drivers = new Set<number>();
  const log: string[] = [];
  let id = 0;
  const deps: DriversDeps = {
    applications: createMemoryApplications(),
    decisions: createMemoryDecisions(),
    photos: createMemoryImages(),
    people: {
      find: async (userId) => persons.get(userId),
      idOf: idOfPublic,
      setDriver: async (userId, isDriver) => void (isDriver ? drivers.add(userId) : drivers.delete(userId)),
      approveFace: async (userId) => void log.push(`face:${userId}`),
      avatar: async () => jpeg,
    },
    notify: {
      submitted: async (application) => void log.push(`submitted:${application.status}`),
      decided: async (application, fixedPlate) =>
        void log.push(`decided:${application.status}${fixedPlate ? `:${fixedPlate}` : ''}`),
    },
    driverApproved: async (userId) => (log.push(`approved:${userId}`), null),
    liveTrips: async () => liveTrips,
    now: () => 1000,
    newId: () => `id${(id += 1)}`,
  };
  const photos = async () => {
    for (const kind of ['front', 'side', 'interior'] as const) await uploadCarPhoto(deps, 1, kind, jpeg);
  };
  return { deps, drivers, log, photos, onTrip: () => void (liveTrips = true) };
}
