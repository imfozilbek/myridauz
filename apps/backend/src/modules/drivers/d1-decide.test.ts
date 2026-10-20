import { describe, expect, it } from 'vitest';
import { testD1 } from '../../test-d1';
import { emptyApplication } from './domain/application';
import { d1Applications } from './infrastructure/d1-applications';

const CAR = { make: 'Chevrolet', model: 'Cobalt', color: 'white', plate: '01A123BC', seats: 4 } as const;

// The decision on an application in D1, one guarded step (G89 M5).
describe('a decision on a driver application in D1', () => {
  it('is written once, only on the waiting application the team read', async () => {
    const db = testD1();
    await db.exec(`INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at)
      VALUES (1, 'Jasur', 'male', '998900000001', 0, 0, 0)`);
    const applications = d1Applications(db);
    const pending = { ...emptyApplication(1, 10), status: 'pending' as const, car: CAR, submittedAt: 10 };
    await applications.save(pending);
    const approved = {
      ...pending,
      status: 'approved' as const,
      car: { ...CAR, plate: '01A124BC' },
      decidedBy: 900,
      updatedAt: 20,
    };
    const rejected = {
      ...pending,
      status: 'rejected' as const,
      reasons: ['fake_profile' as const],
      updatedAt: 21,
    };
    expect(await applications.decide(approved, pending)).toBe(true);
    expect(await applications.decide(rejected, pending)).toBe(false);
    expect(await applications.find(1)).toMatchObject({
      status: 'approved',
      car: { plate: '01A124BC' },
      decidedBy: 900,
    });
  });
});
