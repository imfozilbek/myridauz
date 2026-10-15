import { describe, expect, it } from 'vitest';
import { fullScans, testD1 } from '../../test-d1';
import { directionsOf, loopsOf } from './domain/rost';
import { analyticsSql } from './infrastructure/analytics-sql';
import { d1Numbers } from './infrastructure/d1-numbers';

const NOW = Date.parse('2026-10-15T05:00:00Z');
const row = (loop: string) => (rows: ReturnType<typeof loopsOf>) => rows.find((one) => one.loop === loop);

// «Rost» of the team (G69, docs/123): each loop and each direction.
describe('«Rost»', () => {
  it('sums the marks of every author by their loop, never a channel or an ad', () => {
    const came = [
      { via: 'qr-a1b2c3', count: 4 },
      { via: 'qr-zzzzzz', count: 2 },
      { via: 'ch-samarqand', count: 9 },
    ];
    const arrivals = [
      { via: 'qr-a1b2c3', client: 'android', count: 2 },
      { via: 'seats-a1b2c3', client: 'ios', count: 1 },
      { via: null, client: null, count: 5 },
    ];
    const loops = loopsOf(came, arrivals, [{ via: 'qr-a1b2c3', count: 1 }]);
    expect(loops).toHaveLength(8);
    expect(row('qr')(loops)).toEqual({ loop: 'qr', came: 6, registered: 2, rode: 1 });
    expect(row('seats')(loops)).toEqual({ loop: 'seats', came: 0, registered: 1, rode: 0 });
  });

  it('counts the searches of each direction and the found ones, the most searched first', () => {
    expect(
      directionsOf([
        { route: '1726-1718', result: 'found', count: 7 },
        { route: '1726-1718', result: 'empty', count: 3 },
        { route: '1726-1703', result: 'empty', count: 20 },
        { route: 'x', result: 'found', count: 1 },
      ]),
    ).toEqual([
      { route: '1726-1703', searches: 20, found: 0 },
      { route: '1726-1718', searches: 10, found: 7 },
    ]);
  });

  it('finds the new people of a mark who rode, through the index of the arrival', async () => {
    const db = testD1();
    await db.exec(`PRAGMA foreign_keys = OFF;
      INSERT INTO user_arrivals (user_id, via, arrived_at) VALUES
        (1, 'qr-a1b2c3', ${NOW}), (2, 'qr-a1b2c3', ${NOW}), (3, 'seats-a1b2c3', ${NOW - 9e9});
      INSERT INTO trips (id, driver_id, from_id, to_id, depart_at, ends_at, km, seats, price, status, created_at)
        VALUES ('t', 9, '1726273', '1718401', ${NOW}, ${NOW}, 300, 4, 90000, 'completed', 0);
      INSERT INTO bookings (id, trip_id, passenger_id, seats, price, commission, status, expires_at, created_at, updated_at)
        VALUES ('b1', 't', 1, 1, 90000, 9000, 'completed', 0, 0, 0), ('b3', 't', 3, 1, 90000, 9000, 'completed', 0, 0, 0)`);
    expect(await d1Numbers(db).riders(NOW - 1000)).toEqual([{ via: 'qr-a1b2c3', count: 1 }]);
    expect(fullScans(db)).toEqual([]);
  });

  it('asks Analytics Engine for the marks of the first screens and the directions of the searches', async () => {
    const bodies: string[] = [];
    const source = analyticsSql({
      accountId: 'acc',
      token: 'read-only',
      dataset: 'app_analytics',
      fetch: async (_url, init) => {
        bodies.push(String(init?.body));
        return Response.json({
          data: [{ via: 'qr-a1b2c3', route: '1726-1718', result: 'found', count: '3' }],
        });
      },
    });
    expect(await source.marks(7)).toEqual([{ via: 'qr-a1b2c3', count: 3 }]);
    expect(await source.searches(30)).toEqual([{ route: '1726-1718', result: 'found', count: 3 }]);
    expect(bodies[0]).toContain(
      "count(DISTINCT blob5) AS count FROM app_analytics WHERE timestamp > NOW() - INTERVAL '7' DAY",
    );
    expect(bodies[0]).toContain("blob1 = 'screen_open' AND blob11 != ''");
    expect(bodies[1]).toContain("blob1 = 'trip_search' AND blob7 != ''");
  });
});
