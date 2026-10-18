import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { d1Users } from '../users/infrastructure/d1-users';
import { d1Growth } from './infrastructure/d1-growth';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-15T05:00:00Z');
const DRIVER = 1;
const ALI = 2;
const VALI = 3;
const trip = (id: string, departAt: number, status = 'completed') =>
  `('${id}', ${DRIVER}, '1726273', '1718401', ${departAt}, ${departAt + DAY / 4}, 300, 4, 90000, '${status}', 0)`;
const booking = (id: string, tripId: string, passenger: number, seats: number, status = 'completed') =>
  `('${id}', '${tripId}', ${passenger}, ${seats}, 90000, 9000, '${status}', 0, 0, 0)`;

async function seeded() {
  const db = testD1();
  await db.exec(`PRAGMA foreign_keys = OFF;
    INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
    VALUES ${[trip('old', NOW - 9 * DAY), trip('new', NOW - DAY), trip('open', NOW + DAY, 'active')].join(', ')};
    INSERT INTO bookings (id, trip_id, passenger_id, seats, price, commission, status, expires_at, created_at, updated_at)
    VALUES ${[
      booking('b1', 'old', ALI, 1),
      booking('b2', 'new', ALI, 2),
      booking('b3', 'new', VALI, 1, 'cancelled_by_passenger'),
      booking('b4', 'open', VALI, 1, 'confirmed'),
    ].join(', ')};
    UPDATE bookings SET no_show_at = ${NOW} WHERE id = 'b1';`);
  return { db, growth: d1Growth(db) };
}

// The codes, the people they brought and the moments of G69 in D1 (migration 0069, docs/123).
describe('the loops of growth in D1', () => {
  it('makes one short code per person and keeps it', async () => {
    const { growth } = await seeded();
    const code = await growth.codeOf(ALI);
    expect(code).toMatch(/^[a-z0-9]{6}$/u);
    expect(await growth.codeOf(ALI)).toBe(code);
    expect(await growth.codeOf(VALI)).not.toBe(code);
  });

  it('knows who came by the code of a person and who of them rode', async () => {
    const { db, growth } = await seeded();
    const users = d1Users(db);
    const code = await growth.codeOf(DRIVER);
    await users.arrived(ALI, { source: 'find', via: `share-driver-${code}` }, NOW);
    await users.arrived(VALI, { via: `qr-${code}` }, NOW);
    // The own code brings nobody; a mark of a channel has no author.
    await users.arrived(DRIVER, { via: `seats-${code}` }, NOW);
    await users.arrived(4, { via: 'ch-samarqand' }, NOW);
    expect(await growth.impactOf(DRIVER)).toEqual({ joined: 2, rode: 1 });
    expect(await growth.impactOf(ALI)).toEqual({ joined: 0, rode: 0 });
    await users.erase(ALI, NOW);
    expect(await growth.impactOf(DRIVER)).toEqual({ joined: 1, rode: 0 });
  });

  it('offers a moment once and reads the first approval of a driver', async () => {
    const { db, growth } = await seeded();
    await growth.offer(ALI, 'driver', NOW);
    await growth.offer(ALI, 'driver', NOW + 1);
    expect(await growth.offered(ALI)).toEqual(['driver']);
    // A moment of an older version (a trip, the registration: owner decisions 15 and 18.10.2026) is
    // not a moment.
    await db.exec(`INSERT INTO share_moments (user_id, moment, at)
      VALUES (${ALI}, 'trip1', ${NOW}), (${ALI}, 'join', ${NOW})`);
    expect(await growth.offered(ALI)).toEqual(['driver']);
    expect(await growth.approvedAt(DRIVER)).toBeNull();
    await db.exec(`INSERT INTO application_log (user_id, status, reasons, decided_by, decided_at)
      VALUES (${DRIVER}, 'approved', '[]', 900, ${NOW - DAY}), (${DRIVER}, 'approved', '[]', 900, ${NOW})`);
    expect(await growth.approvedAt(DRIVER)).toBe(NOW - DAY);
  });

  it('never reads a growing table whole', async () => {
    const { db, growth } = await seeded();
    await Promise.all([
      growth.codeOf(ALI),
      growth.impactOf(ALI),
      growth.offered(ALI),
      growth.approvedAt(DRIVER),
    ]);
    expect(fullScans(db)).toEqual([]);
  });
});
