import { readFileSync } from 'node:fs';
import {
  ApiError,
  createDriversClient,
  createModerationClient,
  createUsersClient,
} from '@platform/api-client';
import { CAR_PHOTO_KINDS, type Gender, type MiniApp } from '@platform/contracts';
import { loadBrand } from '../../brands/index';
import { DRIVERS, MEN, OWNER, PASSENGERS } from './people';
import { contactOf, signedAs, type Person } from './stand-kit';

// The people of the scenarios, made through the API of the stand like the apps make them (docs/75).
const CAR = { make: 'Chevrolet', model: 'Cobalt', color: 'white', seats: 4 } as const;
// Any photo does on the stand: a region picture of the brand stands for a face and a car.
export const PHOTO = new Blob([readFileSync(`brands/${loadBrand().id}/public/regions/1726.webp`)], {
  type: 'image/webp',
});
const ALREADY = 'users.already_registered';

async function register(app: MiniApp, person: Person, gender: Gender) {
  const users = createUsersClient(await signedAs(app, person));
  try {
    await users.register({
      consent: true,
      firstName: person.name,
      gender,
      contact: await contactOf(app, person),
    });
  } catch (error) {
    if (!(error instanceof ApiError && error.message === ALREADY)) throw error;
  }
  return users;
}

// A driver sends the application: registration, photo, car photos, the car.
export async function apply(person: Person, plate: string, gender: Gender) {
  const users = await register('driver', person, gender);
  const drivers = createDriversClient(await signedAs('driver', person));
  if ((await drivers.getApplication())?.status === 'approved') return;
  await users.uploadAvatar(PHOTO);
  for (const kind of CAR_PHOTO_KINDS) await drivers.uploadPhoto(kind, PHOTO);
  await drivers.submit({ ...CAR, plate });
}

export default async function seed() {
  for (const { person, plate, gender } of DRIVERS) await apply(person, plate, gender);
  // The owner approves every application in the queue.
  const moderation = createModerationClient(await signedAs('admin', OWNER));
  for (const application of await moderation.queue())
    await moderation.decide(application.userId, { action: 'approve' });
  for (const passenger of PASSENGERS) await register('passenger', passenger, 'female');
  for (const man of MEN) await register('passenger', man, 'male');
}
