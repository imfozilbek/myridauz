// Test helper for the bookings API: a small directory, an approved driver, JSON requests.
import type { Location } from '@platform/contracts';
import { localLocations } from './modules/locations';
import { call, registerUser } from './test-api';

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
  return JSON.parse(text) as T;
}

export async function approvedDriver(id: number) {
  await registerUser(id);
  await call('/me/avatar', id, { method: 'PUT', ...jpeg });
  for (const kind of ['front', 'side', 'interior'])
    await call(`/driver/application/photos/${kind}`, id, { method: 'PUT', app: 'driver', ...jpeg });
  const car = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01 A 123 BC', seats: 4 };
  await call('/driver/application', id, { app: 'driver', ...json(car) });
  await call(`/admin/applications/${id}/decision`, OWNER, { app: 'admin', ...json({ action: 'approve' }) });
}
