import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import type { RequestRecord } from './domain/ride-request';
import { d1Requests } from './infrastructure/d1-requests';

const OPEN: RequestRecord = {
  id: 'r1',
  passengerId: 1,
  from: '1726',
  to: '1718',
  date: '2026-10-01',
  expiresAt: 2,
  km: 300,
  seats: 1,
  price: 90_000,
  status: 'open',
  pickupMode: 'door',
  pickup: null,
  dropoff: null,
  createdAt: 1,
  wholeCar: false,
  withWoman: false,
  callsOff: false,
  note: null,
};

// G89: a request closed meanwhile (taken, cancelled) is never opened again by a save of an older
// read, like the switch of the calls; every read goes by a key.
describe('the ride requests in D1', () => {
  it('saves an open request, and nothing over a closed one', async () => {
    const db = testD1();
    await db.exec('PRAGMA foreign_keys = OFF');
    const requests = d1Requests(db);
    expect(await requests.save(OPEN)).toBe(true);
    expect(await requests.save({ ...OPEN, status: 'matched' })).toBe(true);
    expect(await requests.save({ ...OPEN, callsOff: true })).toBe(false);
    expect(await requests.find('r1')).toMatchObject({ status: 'matched', callsOff: false });
    expect(fullScans(db)).toEqual([]);
  });
});
