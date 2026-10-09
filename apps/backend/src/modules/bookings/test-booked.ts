// Test helper: a confirmed booking of Dilnoza and the times of its meeting (docs/126, G63).
import { loadBrand } from '@platform/brands';
import { MINUTE_MS } from '@platform/contracts';
import { confirm } from './application/answer';
import { requestBooking } from './application/request';
import { DILNOZA, DRIVER, HOUR, NOW, seats, setup } from './test-kit';

// The trips of the test kit leave 30 hours after NOW and end 7 hours later.
export const DEPART = NOW + 30 * HOUR;
export const ENDS = NOW + 37 * HOUR;
// Five minutes into the meeting window before the departure.
export const MEET_MINUTES = loadBrand().schedule.meetMinutes;
export const MEETING = DEPART - (MEET_MINUTES - 5) * MINUTE_MS;

export async function booked() {
  const kit = setup();
  await kit.bonus();
  const result = await requestBooking(kit.deps, DILNOZA, kit.addTrip(), seats(1));
  if (!result.ok) throw new Error('no booking');
  await confirm(kit.deps, DRIVER, result.value.id);
  return { ...kit, id: result.value.id };
}
