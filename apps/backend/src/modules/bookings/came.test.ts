import { describe, expect, it } from 'vitest';
import { markProgress } from './application/progress';
import { booked, MEETING } from './test-booked';
import { DILNOZA } from './test-kit';

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
    setNow(MEETING);
    const first = await markProgress(deps, DILNOZA, id, 'came');
    expect(first.ok && first.value.cameAt).toBeTruthy();
    await markProgress(deps, DILNOZA, id, 'came');
    expect(notes.filter((note) => note.startsWith('driver: came'))).toEqual(['driver: came Dilnoza']);
  });
});
