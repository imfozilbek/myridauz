import { loadBrand } from '@platform/brands';
import { describe, expect, it } from 'vitest';
import type { NotificationJob } from '../notifications';
import { watchDepartures, type DepartureDeps } from './application/departures';
import { departReminder } from './infrastructure/depart-reminder';
import { createMemoryFirst } from './infrastructure/reminder-store';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DEPART = Date.parse('2026-10-08T03:00:00Z');
const TRIP = { id: '00000000-0000-0000-0000-000000000001', driverId: 7, departAt: DEPART };

function setup(start: number) {
  let now = start;
  const asked: [number, number][] = [];
  const done: string[] = [];
  const deps: DepartureDeps = {
    late: async (from, to) => {
      asked.push([from, to]);
      return TRIP.departAt >= from && TRIP.departAt <= to ? [TRIP] : [];
    },
    depart: async (tripId, at) => void done.push(`departed ${tripId} ${at}`),
    first: createMemoryFirst(),
    remind: async (trip) => void done.push(`reminded ${trip.id}`),
    autoDepartHours: loadBrand().schedule.autoDepartHours,
    now: () => now,
  };
  return { deps, asked, done, at: (next: number) => void (now = next) };
}

// No «Yoʻlga chiqdim» an hour after the time (owner decision 06.10.2026, docs/35).
describe('a driver who forgot «Yoʻlga chiqdim» (G63)', () => {
  it('waits an hour, then the bot asks once, then the Cron puts the trip on the road', async () => {
    const { deps, asked, done, at } = setup(DEPART + 59 * MINUTE);
    await watchDepartures(deps);
    expect(done).toEqual([]);
    expect(asked[0]).toEqual([DEPART + 59 * MINUTE - 2 * HOUR - 15 * MINUTE, DEPART - MINUTE]);
    at(DEPART + HOUR);
    await watchDepartures(deps);
    at(DEPART + HOUR + 15 * MINUTE);
    await watchDepartures(deps);
    expect(done).toEqual([`reminded ${TRIP.id}`]);
    at(DEPART + 2 * HOUR + 5 * MINUTE);
    await watchDepartures(deps);
    expect(done.slice(1)).toEqual([`departed ${TRIP.id} ${DEPART + 2 * HOUR + 5 * MINUTE}`]);
  });

  it('asks in the driver bot with a button that opens the trip', async () => {
    const sent: NotificationJob[] = [];
    await departReminder(loadBrand(), async (jobs) => void sent.push(...jobs))(TRIP);
    expect(sent).toMatchObject([{ bot: 'driver', chatId: 7 }]);
    expect(sent[0]?.text).toContain('«Yoʻlga chiqdim»');
    expect(JSON.stringify(sent[0]?.markup)).toContain(`?mytrip=${TRIP.id}`);
  });
});
