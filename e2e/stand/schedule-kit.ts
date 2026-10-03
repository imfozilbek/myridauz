import { loadBrand } from '@platform/brands';
import type { MarketClient } from '@platform/api-client';
import { daySlots, MINUTE_MS, tashkentDayStart } from '@platform/contracts';
import { test } from '@playwright/test';
import type { Person } from './stand-kit';
import { standSql } from './stand-tools';

const RULES = loadBrand().schedule;
const HOUR_MINUTES = 60;
const cleared = new Map<number, string>();

// A driver of the stand plays in many scenarios: the live trips of an earlier scenario do not take
// the time and the limit of this one (G38, docs/103). Inside a scenario its trips stay.
export function freshDriver(driver: Person): void {
  const scenario = test.info().testId;
  if (cleared.get(driver.id) === scenario) return;
  standSql(
    `UPDATE trips SET status = 'cancelled' WHERE driver_id = ${driver.id} AND status IN ('active', 'full')`,
  );
  cleared.set(driver.id, scenario);
}

// The first time on that Tashkent day, from `after` on, the driver may leave at (docs/103).
export async function freeDepart(
  market: MarketClient,
  from: string,
  to: string,
  date: string,
  after: string,
) {
  const { windows } = await market.schedule(from, to);
  const slots = daySlots(date, Date.now(), windows, RULES);
  const [hours = 0, minutes = 0] = (slots.find((slot) => slot >= after) ?? slots[0] ?? after)
    .split(':')
    .map(Number);
  return tashkentDayStart(date) + (hours * HOUR_MINUTES + minutes) * MINUTE_MS;
}
