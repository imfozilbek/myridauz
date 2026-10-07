import { MEET_BEFORE_MINUTES } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { confirm } from './application/answer';
import { markProgress } from './application/progress';
import { requestBooking } from './application/request';
import { DILNOZA, DRIVER, HOUR, NOW, seats, setup } from './test-kit';

const MINUTE = 60 * 1000;

async function booked() {
  const kit = setup();
  await kit.bonus();
  const result = await requestBooking(kit.deps, DILNOZA, kit.addTrip(), seats(1));
  if (!result.ok) throw new Error('no booking');
  await confirm(kit.deps, DRIVER, result.value.id);
  return { ...kit, id: result.value.id };
}

describe('«Men keldim» at the meeting point (docs/126, G60)', () => {
  it('is not taken long before the departure', async () => {
    const { deps, id } = await booked();
    expect(await markProgress(deps, DILNOZA, id, 'came')).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
  });

  it('tells the driver once, close to the departure', async () => {
    const { deps, id, notes, setNow } = await booked();
    setNow(NOW + 30 * HOUR - (MEET_BEFORE_MINUTES - 5) * MINUTE);
    const first = await markProgress(deps, DILNOZA, id, 'came');
    expect(first.ok && first.value.cameAt).toBeTruthy();
    await markProgress(deps, DILNOZA, id, 'came');
    expect(notes.filter((note) => note.startsWith('driver: came'))).toEqual(['driver: came Dilnoza']);
  });
});
