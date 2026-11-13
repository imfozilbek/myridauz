import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../../test-d1';
import { d1PathSteps } from './d1-paths';

const [DRIVER, PASSENGER] = [101, 102];
const user = (id: number) =>
  `INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at, public_id)
     VALUES (${id}, 'A', 'male', '99890${id}', 1, 1, 1, '${String(id).padStart(32, 'a')}')`;

// G99 T7 (docs/234, docs/117): the steps the server sees, once a person, with the first touch; read
// only through indexes, never a table whole.
describe('the steps the server sees (G99)', () => {
  it('gives each person their steps of the period with the first touch, through indexes', async () => {
    const db = testD1();
    await db.batch(
      [
        user(DRIVER),
        user(PASSENGER),
        `INSERT INTO user_arrivals (user_id, source, via, client, arrived_at) VALUES (${PASSENGER}, 'direct', 'ad-insta9', 'ios 8.0 safari 17', 1)`,
        `INSERT INTO driver_applications (user_id, status, updated_at) VALUES (${DRIVER}, 'approved', 500)`,
        `INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
           VALUES ('t1', ${DRIVER}, '1726', '1718', 600, 700, 10, 3, 1000, 'completed', 1)`,
        `INSERT INTO bookings (id, trip_id, passenger_id, seats, price, commission, status, expires_at, created_at, updated_at, confirmed_at, boarded_at)
           VALUES ('b1', 't1', ${PASSENGER}, 1, 1000, 100, 'completed', 1, 1, 1, 550, 610)`,
      ].map((sql) => db.prepare(sql)),
    );
    const steps = await d1PathSteps(db)(400);
    expect(steps.map(({ step, entry, client, at }) => [step, entry, client, at]).sort()).toEqual([
      ['approved', null, null, 500],
      ['confirmed', 'ad-insta9', 'ios 8.0 safari 17', 550],
      ['first_booking', null, null, 550],
      ['rode', 'ad-insta9', 'ios 8.0 safari 17', 610],
      ['trip_done', null, null, 700],
    ]);
    expect(await d1PathSteps(db)(800)).toEqual([]);
    expect(fullScans(db)).toEqual([]);
  });
});
