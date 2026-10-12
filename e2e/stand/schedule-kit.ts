import { loadBrand } from '@platform/brands';
import { daySlots, MINUTE_MS, tashkentDayStart } from '@platform/contracts';
import { test } from '../crash-guard';
import type { Person } from './stand-kit';
import { standSql } from './stand-tools';

const RULES = loadBrand().schedule;
const HOUR_MINUTES = 60;
const cleared = new Map<string, string>();

// Once a scenario: what a person left in an earlier scenario does not hold this one.
function onceInScenario(key: string, clear: () => void): void {
  const scenario = test.info().testId;
  if (cleared.get(key) === scenario) return;
  clear();
  cleared.set(key, scenario);
}

// A driver of the stand plays in many scenarios: the live trip of an earlier scenario does not hold
// this one (one live trip, docs/172). Inside a scenario its trips stay.
export function freshDriver(driver: Person): void {
  onceInScenario(`driver:${driver.id}`, () =>
    standSql(
      `UPDATE trips SET status = 'cancelled' WHERE driver_id = ${driver.id} AND status IN ('active', 'full')`,
    ),
  );
}

// A passenger has one open request or one seat (docs/172): those of an earlier scenario are closed.
export function freshPassenger(passenger: Person): void {
  onceInScenario(`passenger:${passenger.id}`, () => {
    standSql(
      `UPDATE ride_requests SET status = 'cancelled' WHERE passenger_id = ${passenger.id} AND status = 'open'`,
    );
    const live = `SELECT id FROM trips WHERE status IN ('active', 'full')`;
    standSql(
      `UPDATE bookings SET status = 'cancelled_by_passenger' WHERE passenger_id = ${passenger.id} AND status IN ('requested', 'confirmed') AND trip_id IN (${live})`,
    );
  });
}

// The first time on that Tashkent day, from `after` on, the driver may leave at (docs/103).
export function freeDepart(date: string, after: string): number {
  const slots = daySlots(date, Date.now(), RULES);
  const [hours = 0, minutes = 0] = (slots.find((slot) => slot >= after) ?? slots[0] ?? after)
    .split(':')
    .map(Number);
  return tashkentDayStart(date) + (hours * HOUR_MINUTES + minutes) * MINUTE_MS;
}
