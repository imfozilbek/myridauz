import {
  AVATAR_TYPES,
  catalogSeats,
  MAX_AVATAR_BYTES,
  type Car,
  type CarPhotoKind,
  type DriverApplication,
} from '@platform/contracts';
import type { StoredImage } from '../../../shared/storage/image-store';
import { emptyApplication, submit, withPhoto, type Application } from '../domain/application';
import type { DriversDeps, Result } from './ports';

type ApplyError =
  'drivers.not_found' | 'drivers.invalid_input' | 'drivers.photo_too_large' | 'drivers.wrong_status';

const toView = (application: Application): DriverApplication => ({
  status: application.status,
  car: application.car,
  photos: {
    front: application.photos.front !== null,
    side: application.photos.side !== null,
    interior: application.photos.interior !== null,
  },
  reasons: [...application.reasons],
});

export async function myApplication(deps: DriversDeps, userId: number): Promise<DriverApplication | null> {
  const application = await deps.applications.find(userId);
  return application ? toView(application) : null;
}

// Car photos are compressed on the phone like the avatar (docs/05) and kept in the private bucket.
export async function uploadCarPhoto(
  deps: DriversDeps,
  userId: number,
  kind: CarPhotoKind,
  image: { readonly body: ArrayBuffer; readonly type: string },
): Promise<Result<DriverApplication, ApplyError>> {
  if (!(await deps.people.find(userId))) return { ok: false, error: 'drivers.not_found' };
  if (!(AVATAR_TYPES as readonly string[]).includes(image.type) || image.body.byteLength === 0) {
    return { ok: false, error: 'drivers.invalid_input' };
  }
  if (image.body.byteLength > MAX_AVATAR_BYTES) return { ok: false, error: 'drivers.photo_too_large' };
  const current = (await deps.applications.find(userId)) ?? emptyApplication(userId, deps.now());
  const key = `cars/${userId}/${kind}/${deps.newId()}`;
  const next = withPhoto(current, kind, key, deps.now());
  if (typeof next === 'string') return { ok: false, error: next };
  await deps.photos.put(key, image.body, image.type);
  await deps.applications.save(next);
  const old = current.photos[kind];
  if (old) await deps.photos.delete(old);
  // An approved driver who changes the car is not a driver until the team checks it again.
  if (current.status === 'approved') await deps.people.setDriver(userId, false);
  return { ok: true, value: toView(next) };
}

// A model from the list has its seats, whatever the phone sends (docs/50); a typed model keeps the answer.
const withCatalogSeats = (car: Car): Car => ({
  ...car,
  seats: catalogSeats(car.make, car.model) ?? car.seats,
});

export async function submitApplication(
  deps: DriversDeps,
  userId: number,
  car: Car,
): Promise<Result<DriverApplication, ApplyError | 'drivers.incomplete'>> {
  const person = await deps.people.find(userId);
  const current = await deps.applications.find(userId);
  if (!person || !current) return { ok: false, error: person ? 'drivers.incomplete' : 'drivers.not_found' };
  const next = submit(current, withCatalogSeats(car), person.avatarKey !== null, deps.now());
  if (typeof next === 'string') return { ok: false, error: next };
  await deps.applications.save(next);
  if (current.status === 'approved') await deps.people.setDriver(userId, false);
  await deps.notify.submitted(next, person);
  return { ok: true, value: toView(next) };
}

export async function myCarPhoto(
  deps: DriversDeps,
  userId: number,
  kind: CarPhotoKind,
): Promise<StoredImage | undefined> {
  const key = (await deps.applications.find(userId))?.photos[kind];
  return key ? deps.photos.get(key) : undefined;
}
