import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { peopleRows } from '../../test-people';
import { emptyApplication, fixCar, reopen } from './domain/application';
import { d1Applications } from './infrastructure/d1-applications';
import { d1Decisions } from './infrastructure/d1-decisions';

const CAR = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 } as const;
const SEEN = { ...CAR, plate: '01A777BC' };
const withPeople = async () => {
  const db = testD1();
  await db.exec(peopleRows([1]));
  return db;
};

// G95 (docs/224) in D1: a fix of the team is one guarded write too (G89 M5).
describe('a fix of the team on a driver application in D1', () => {
  it('writes the car of an approved application once, on the application as read', async () => {
    const applications = d1Applications(await withPeople());
    const approved = { ...emptyApplication(1, 10), status: 'approved' as const, car: CAR, submittedAt: 10 };
    await applications.save(approved);
    const first = fixCar(approved, SEEN, 900, 10);
    const second = fixCar(approved, { ...SEEN, plate: '01A778BC' }, 901, 10);
    if (typeof first === 'string' || typeof second === 'string') throw new Error('fixable');
    expect(await applications.decide(first, approved)).toBe(true);
    expect(await applications.decide(second, approved)).toBe(false);
    expect(await applications.find(1)).toMatchObject({ status: 'approved', car: SEEN, decidedBy: 900 });
  });

  it('sends a refusal back to the queue as sent now', async () => {
    const applications = d1Applications(await withPeople());
    const rejected = { ...emptyApplication(1, 10), status: 'rejected' as const, car: CAR, submittedAt: 10 };
    await applications.save({ ...rejected, reasons: ['fake_profile'] });
    const back = reopen({ ...rejected, reasons: ['fake_profile'] }, 50);
    if (typeof back === 'string') throw new Error('reopenable');
    expect(await applications.decide(back, { ...rejected, reasons: ['fake_profile'] })).toBe(true);
    expect(await applications.find(1)).toMatchObject({ status: 'pending', reasons: [], submittedAt: 50 });
    expect((await applications.queue()).map((one) => one.userId)).toEqual([1]);
  });
});

describe('«Mening qarorlarim» in D1', () => {
  it('reads the decisions of one member since a time, the newest first', async () => {
    const decisions = d1Decisions(testD1());
    const add = (userId: number, by: number, at: number) =>
      decisions.add({ userId, status: 'approved', reasons: [], by, at, car: null });
    await add(1, 900, 100);
    await add(2, 900, 300);
    await add(3, 901, 400);
    await add(4, 900, 50);
    expect((await decisions.by(900, 60)).map((one) => [one.userId, one.at])).toEqual([
      [2, 300],
      [1, 100],
    ]);
  });
});
