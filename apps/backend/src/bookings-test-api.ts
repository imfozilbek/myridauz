import { expect } from 'vitest';
// Test helper for the bookings API: a small directory, an approved driver, JSON requests.
import type { Location } from '@platform/contracts';
import { localLocations } from './modules/locations';
import { call, pid, registerUser } from './test-api';

const place = (id: string, parentId: string | null, oneCity = false): Location => ({
  id,
  parentId,
  type: parentId ? 'city' : 'region',
  name: id,
  lat: 41,
  lng: 69,
  oneCity,
});
localLocations.load([
  place('1726', null, true),
  place('1726273', '1726'),
  place('1718', null),
  place('1718401', '1718'),
]);
await localLocations.saveDistance('1718401', '1726273', 300, 0);

export const OWNER = 900;
const jpeg = { body: new Uint8Array(20), headers: { 'content-type': 'image/jpeg' } };
export const json = (body: unknown, method = 'POST') => ({
  method,
  body: JSON.stringify(body),
  headers: { 'content-type': 'application/json' },
});
// Every answer of the API is read here: a phone or a username must never be in one (docs/07).
export const seen: string[] = [];
export async function read<T>(response: Promise<Response>): Promise<T> {
  const text = await (await response).text();
  seen.push(text);
  const data: unknown = JSON.parse(text);
  expect(telegramIds(data)).toEqual([]);
  return data as T;
}

// A person in an answer is only a public id, never a Telegram ID (docs/65 A3).
const PEOPLE = new Set(['driver', 'passenger', 'author', 'against']);
const ID_KEYS = new Set(['userId', 'driverId', 'rateeId', 'passengerId', 'authorId', 'againstId']);
function telegramIds(value: unknown, parent = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => telegramIds(item, parent));
  if (typeof value !== 'object' || value === null) return [];
  return Object.entries(value).flatMap(([key, item]) => {
    const person = ID_KEYS.has(key) || (key === 'id' && PEOPLE.has(parent));
    return person && typeof item === 'number' ? [`${parent}.${key}`] : telegramIds(item, key);
  });
}

export async function approvedDriver(id: number) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of ['front', 'side', 'interior'])
    await call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
  const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01 A 123 BC', seats: 4 };
  await call('/driver/application', id, { app: 'driver', ...json(car) });
  await call(`/admin/applications/${await pid(id)}/decision`, OWNER, {
    app: 'admin',
    ...json({ action: 'approve' }),
  });
}
