import { describe, expect, it } from 'vitest';
import { answer } from './application/answer';
import { expireRequests } from './application/expire';
import { requestBooking } from './application/request';
import { DILNOZA, DRIVER, HOUR, NOW, seats, setup } from './test-kit';

// The funnel sees the requests nobody answered and the ones a driver refused (docs/89 S2):
// the server records them, no Mini App is open at that moment.
describe('booking steps the server records (docs/29)', () => {
  it('records a «no» of the driver and a request that burned without an answer', async () => {
    const { deps, addTrip, notes } = setup();
    const tripId = addTrip();
    const refused = await requestBooking(deps, DILNOZA, tripId, seats(1));
    const waiting = await requestBooking(deps, DILNOZA, addTrip(), seats(1));
    if (!refused.ok || !waiting.ok) throw new Error('no booking');
    await answer(deps, DRIVER, refused.value.id, 'decline');
    await expireRequests(deps, NOW + 25 * HOUR);
    expect(notes.filter((note) => note.startsWith('step:'))).toEqual(['step: declined', 'step: expired']);
  });
});
