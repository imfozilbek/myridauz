import { DAY_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { submitApplication } from './application/apply';
import { fixApprovedCar, myDecisions, reopenRejected } from './application/fixes';
import { decideApplication } from './application/moderate';
import { CAR, setup } from './test-kit';

// G95 (docs/224): the team finds its own decisions and fixes them.
const MODERATOR = 900;
const OWNER = 901;
const SEEN = { ...CAR, plate: '01A777BC' };

async function approved() {
  const kit = setup();
  await kit.photos();
  await submitApplication(kit.deps, 1, CAR);
  await decideApplication(kit.deps, MODERATOR, 1, { action: 'approve' });
  return kit;
}

describe('«Mashinani tuzatish»', () => {
  it('writes the car of the photo, keeps the driver, reaches the trips and tells the driver', async () => {
    const { deps, drivers, log } = await approved();
    const fixed = await fixApprovedCar(deps, MODERATOR, 1, { ...SEEN, model: 'Nexia', seats: 7 });
    expect(fixed.ok).toBe(true);
    // A model from the list keeps its seats, whatever the phone sends (docs/50).
    expect((await deps.applications.find(1))?.car).toEqual({ ...SEEN, model: 'Nexia', seats: 4 });
    expect(drivers.has(1)).toBe(true);
    expect(log).toContain('trips:1:01A777BC');
    expect(log).toContain('carFixed:01A777BC');
    expect((await deps.decisions.of(1)).at(-1)).toMatchObject({
      status: 'approved',
      by: MODERATOR,
      car: { plate: '01A777BC' },
    });
  });

  it('is only for an approved car: a waiting or a refused one is decided in «Navbat»', async () => {
    const { deps, photos } = setup();
    await photos();
    await submitApplication(deps, 1, CAR);
    expect(await fixApprovedCar(deps, MODERATOR, 1, SEEN)).toEqual({
      ok: false,
      error: 'drivers.wrong_status',
    });
    expect(await fixApprovedCar(deps, MODERATOR, 2, SEEN)).toEqual({ ok: false, error: 'drivers.not_found' });
  });

  it('two members at once: one fix wins, the other hears it changed', async () => {
    const { deps, log } = await approved();
    const both = await Promise.all([
      fixApprovedCar(deps, MODERATOR, 1, SEEN),
      fixApprovedCar(deps, OWNER, 1, { ...SEEN, plate: '01A778BC' }),
    ]);
    expect(both.filter((one) => one.ok)).toHaveLength(1);
    expect(log.filter((line) => line.startsWith('carFixed:'))).toHaveLength(1);
  });
});

describe('«Tuzatishga qaytarish» of an approved driver', () => {
  it('asks a fix, keeps the driver for the live trips, never refuses for good', async () => {
    const { deps, drivers } = await approved();
    const back = await decideApplication(deps, MODERATOR, 1, {
      action: 'request_changes',
      reasons: ['plate_not_readable'],
    });
    expect(back.ok && back.value.status).toBe('changes_requested');
    expect(drivers.has(1)).toBe(true);
    const reject = await decideApplication(deps, MODERATOR, 1, {
      action: 'reject',
      reasons: ['fake_profile'],
    });
    expect(reject).toEqual({ ok: false, error: 'drivers.wrong_status' });
  });

  // The check of a fixed photo: «Tuzatish» again never drops the driver of a live trip; the car
  // approved again reaches the live trips.
  it('keeps the driver through the new check and gives the trips the car approved again', async () => {
    const { deps, drivers, log, onTrip } = await approved();
    onTrip();
    await decideApplication(deps, MODERATOR, 1, {
      action: 'request_changes',
      reasons: ['plate_not_readable'],
    });
    await submitApplication(deps, 1, SEEN);
    await decideApplication(deps, MODERATOR, 1, { action: 'request_changes', reasons: ['front_unclear'] });
    expect(drivers.has(1)).toBe(true);
    await submitApplication(deps, 1, SEEN);
    await decideApplication(deps, MODERATOR, 1, { action: 'approve' });
    expect(log).toContain('trips:1:01A777BC');
  });

  it('never approves an approved application twice', async () => {
    const { deps } = await approved();
    expect(await decideApplication(deps, MODERATOR, 1, { action: 'approve' })).toEqual({
      ok: false,
      error: 'drivers.wrong_status',
    });
  });
});

describe('«Rad etishni bekor qilish»', () => {
  it('sends a refusal back to «Navbat» as sent now, without its reasons', async () => {
    const { deps, photos, log } = setup();
    await photos();
    await submitApplication(deps, 1, CAR);
    await decideApplication(deps, MODERATOR, 1, { action: 'reject', reasons: ['fake_profile'] });
    expect(await reopenRejected(deps, OWNER, 1)).toEqual({ ok: true, value: null });
    expect(await deps.applications.find(1)).toMatchObject({
      status: 'pending',
      reasons: [],
      submittedAt: 1000,
    });
    expect((await deps.applications.queue()).map((one) => one.userId)).toEqual([1]);
    expect(log).toContain('reopened:pending');
    expect(await reopenRejected(deps, OWNER, 1)).toEqual({ ok: false, error: 'drivers.wrong_status' });
  });
});

describe('«Mening qarorlarim»', () => {
  it('lists the own decisions of 7 days, the newest first, with the plate; no reopen, no others', async () => {
    const { deps } = await approved();
    const add = (by: number, status: 'approved' | 'rejected' | 'pending', at: number) =>
      deps.decisions.add({ userId: 1, status, reasons: [], by, at, car: null });
    await add(MODERATOR, 'rejected', 1000 - 8 * DAY_MS);
    await add(OWNER, 'pending', 900);
    await add(MODERATOR, 'approved', 2000);
    const mine = await myDecisions(deps, MODERATOR);
    expect(mine.map((one) => [one.status, one.at, one.plate, one.firstName])).toEqual([
      ['approved', 2000, '01A123BC', 'Ali'],
      ['approved', 1000, '01A123BC', 'Ali'],
    ]);
  });
});
