import type { Car } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { createMemoryImages } from '../../shared/storage/memory-images';
import { myApplication, submitApplication, uploadCarPhoto } from './application/apply';
import { applicantPhoto, avatarChanged, decideApplication, queue } from './application/moderate';
import type { DriversDeps, Person } from './application/ports';
import { createMemoryApplications, createMemoryDecisions } from './infrastructure/memory-applications';
import { idOfPublic, publicIdOf } from '../../test-people';

const CAR: Car = {
  make: 'Chevrolet',
  model: 'Cobalt',
  color: 'white',
  plate: '01A123BC',
  seats: 4,
};
const jpeg = { body: new ArrayBuffer(10), type: 'image/jpeg' };

function setup(avatarKey: string | null = 'avatars/1/a') {
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
    now: () => 1000,
    newId: () => `id${(id += 1)}`,
  };
  const photos = async () => {
    for (const kind of ['front', 'side', 'interior'] as const) await uploadCarPhoto(deps, 1, kind, jpeg);
  };
  return { deps, drivers, log, photos };
}

describe('driver application (docs/04)', () => {
  it('needs the avatar and three car photos before the check', async () => {
    const { deps, photos } = setup(null);
    expect(await submitApplication(deps, 1, CAR)).toEqual({ ok: false, error: 'drivers.incomplete' });
    await photos();
    expect(await submitApplication(deps, 1, CAR)).toEqual({ ok: false, error: 'drivers.incomplete' });
    expect((await myApplication(deps, 1))?.photos).toEqual({ front: true, side: true, interior: true });
  });

  it('goes draft → pending → approved and makes a driver', async () => {
    const { deps, drivers, log, photos } = setup();
    await photos();
    const sent = await submitApplication(deps, 1, CAR);
    expect(sent.ok && sent.value.status).toBe('pending');
    expect((await queue(deps)).map((item) => item.userId)).toEqual([publicIdOf(1)]);
    expect(await uploadCarPhoto(deps, 1, 'front', jpeg)).toEqual({
      ok: false,
      error: 'drivers.wrong_status',
    });
    const decided = await decideApplication(deps, 900, 1, { action: 'approve', plate: '01A124BC' });
    expect(decided.ok && decided.value.status).toBe('approved');
    expect(drivers.has(1)).toBe(true);
    expect(decided.ok && decided.value.car.plate).toBe('01A124BC');
    // The face in the approved application is approved too (G51).
    expect(log).toEqual(['submitted:pending', 'face:1', 'approved:1', 'decided:approved:01A124BC']);
    expect(await decideApplication(deps, 900, 1, { action: 'approve' })).toEqual({
      ok: false,
      error: 'drivers.wrong_status',
    });
  });

  it('takes the seats of a model from the list, and the answer for a typed model', async () => {
    const send = async (car: Car) => {
      const { deps, photos } = setup();
      await photos();
      const sent = await submitApplication(deps, 1, car);
      return sent.ok ? sent.value.car?.seats : sent.error;
    };
    expect(await send({ ...CAR, model: 'Damas', seats: 7 })).toBe(6);
    expect(await send({ ...CAR, make: 'Isuzu', model: 'Grafter', seats: 7 })).toBe(7);
  });

  it('gives reasons on reject and changes, and takes the application again', async () => {
    const { deps, photos } = setup();
    await photos();
    await submitApplication(deps, 1, CAR);
    const reasons = ['plate_not_readable', 'face_not_visible', 'interior_unclear'] as const;
    await decideApplication(deps, 900, 1, { action: 'request_changes', reasons: [...reasons] });
    expect(await myApplication(deps, 1)).toMatchObject({ status: 'changes_requested', reasons });
    // A fixed place is no longer marked: a new front photo, then a new face.
    await uploadCarPhoto(deps, 1, 'front', jpeg);
    await avatarChanged(deps, 1);
    expect((await myApplication(deps, 1))?.reasons).toEqual(['interior_unclear']);
    const again = await submitApplication(deps, 1, { ...CAR, plate: '01 a 124 bc' });
    expect(again.ok && again.value).toMatchObject({ status: 'pending', reasons: [] });
    await decideApplication(deps, 900, 1, { action: 'reject', reasons: ['fake_profile'] });
    expect(await myApplication(deps, 1)).toMatchObject({ status: 'rejected', reasons: ['fake_profile'] });
  });

  it('sends an approved driver back to the check after a new car photo or a new face', async () => {
    const { deps, drivers, photos } = setup();
    await photos();
    await submitApplication(deps, 1, CAR);
    await decideApplication(deps, 900, 1, { action: 'approve' });
    await avatarChanged(deps, 1);
    expect((await myApplication(deps, 1))?.status).toBe('pending');
    expect(drivers.has(1)).toBe(false);
    await decideApplication(deps, 900, 1, { action: 'approve' });
    await uploadCarPhoto(deps, 1, 'side', jpeg);
    expect((await myApplication(deps, 1))?.status).toBe('draft');
    expect(drivers.has(1)).toBe(false);
  });

  it('keeps photos private and checks their type and size', async () => {
    const { deps } = setup();
    expect(await uploadCarPhoto(deps, 1, 'front', { body: new ArrayBuffer(1), type: 'text/html' })).toEqual({
      ok: false,
      error: 'drivers.invalid_input',
    });
    expect(await uploadCarPhoto(deps, 1, 'front', { ...jpeg, body: new ArrayBuffer(400 * 1024) })).toEqual({
      ok: false,
      error: 'drivers.photo_too_large',
    });
    expect(await uploadCarPhoto(deps, 2, 'front', jpeg)).toEqual({ ok: false, error: 'drivers.not_found' });
    await uploadCarPhoto(deps, 1, 'front', jpeg);
    expect(await applicantPhoto(deps, 1, 'front')).toEqual(jpeg);
    expect(await applicantPhoto(deps, 1, 'avatar')).toEqual(jpeg);
    expect(await applicantPhoto(deps, 1, 'side')).toBeUndefined();
  });
});
