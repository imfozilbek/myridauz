import { describe, expect, it } from 'vitest';
import { publishTrip } from './application/publish';
import { cancelTrip, tripDetail } from './application/read';
import { HOUR, NOW, setup } from './test-kit';

describe('a trip that already left (G27, docs/83 N02)', () => {
  it('is not cancelled: its confirmed seats would stay without a word and a refund', async () => {
    const { deps, trip, setNow } = setup();
    const published = await publishTrip(deps, 1, trip);
    const id = published.ok ? published.value.id : '';
    // 3 h to leave: an hour after the departure the trip is still on the road.
    setNow(NOW + 4 * HOUR);
    expect(await cancelTrip(deps, 1, id)).toEqual({ ok: false, error: 'trips.wrong_status' });
    expect((await tripDetail(deps, id, 0))?.status).toBe('active');
  });
});
