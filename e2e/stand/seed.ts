import { readFileSync } from 'node:fs';
import {
  ApiError,
  createDriversClient,
  createModerationClient,
  createUsersClient,
} from '@platform/api-client';
import { CAR_PHOTO_KINDS, type Gender, type MiniApp } from '@platform/contracts';
import { loadBrand } from '../../brands/index';
import { STAND_OWNER_ID } from '../../scripts/stand/paths.ts';
import { contactOf, signedAs, type Person } from './stand-kit';

// The people of the scenarios, made through the API of the stand like the apps make them (docs/75).
export const OWNER: Person = { id: STAND_OWNER_ID, name: 'Ali', phone: '998900000001' };
export const DRIVER: Person = { id: 900101, name: 'Jasur', phone: '998901110101' };
export const NODIRA: Person = { id: 900201, name: 'Nodira', phone: '998901110201' };
export const MADINA: Person = { id: 900202, name: 'Madina', phone: '998901110202' };
export const DILNOZA: Person = { id: 900203, name: 'Dilnoza', phone: '998901110203' };
const CAR = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 } as const;
// Any photo does on the stand: a region picture of the brand stands for a face and a car.
const PHOTO = new Blob([readFileSync(`brands/${loadBrand().id}/public/regions/1726.webp`)], {
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

// A driver with an approved car: registration, photo, car photos, the car, the owner approves.
async function approvedDriver() {
  const users = await register('driver', DRIVER, 'male');
  const drivers = createDriversClient(await signedAs('driver', DRIVER));
  if ((await drivers.getApplication())?.status === 'approved') return;
  await users.uploadAvatar(PHOTO);
  for (const kind of CAR_PHOTO_KINDS) await drivers.uploadPhoto(kind, PHOTO);
  await drivers.submit(CAR);
  const moderation = createModerationClient(await signedAs('admin', OWNER));
  const [application] = await moderation.queue();
  if (!application) throw new Error('stand: the application is not in the queue');
  await moderation.decide(application.userId, { action: 'approve' });
}

export default async function seed() {
  await approvedDriver();
  for (const passenger of [NODIRA, MADINA, DILNOZA]) await register('passenger', passenger, 'female');
}
