import { MEET_BEFORE_MINUTES } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { confirm, driverBookings } from './application/answer';
import { markMeeting } from './application/meeting';
import { requestBooking } from './application/request';
import { DILNOZA, DRIVER, HOUR, NOW, OLIM, seats, setup } from './test-kit';

const MINUTE = 60 * 1000;
// The trips of the test kit leave 30 hours after NOW and end 7 hours later.
const DEPART = NOW + 30 * HOUR;
const ENDS = NOW + 37 * HOUR;
const MEETING = DEPART - (MEET_BEFORE_MINUTES - 5) * MINUTE;

async function booked() {
  const kit = setup();
  await kit.bonus();
  const result = await requestBooking(kit.deps, DILNOZA, kit.addTrip(), seats(1));
  if (!result.ok) throw new Error('no booking');
  await confirm(kit.deps, DRIVER, result.value.id);
  return { ...kit, id: result.value.id };
}

describe('the driver at the point of the passenger (docs/126, G63)', () => {
  it('only the driver of the trip marks, only a confirmed booking', async () => {
    const kit = setup();
    await kit.bonus();
    const asked = await requestBooking(kit.deps, DILNOZA, kit.addTrip(), seats(1));
    const id = asked.ok ? asked.value.id : '';
    kit.setNow(MEETING);
    expect(await markMeeting(kit.deps, OLIM, id, 'came')).toEqual({ ok: false, error: 'bookings.not_found' });
    expect(await markMeeting(kit.deps, DRIVER, id, 'met')).toEqual({
      ok: false,
      error: 'bookings.wrong_status',
    });
  });

  it('opens MEET_BEFORE_MINUTES before the departure and closes with the trip', async () => {
    const { deps, id, setNow } = await booked();
    const early = { ok: false, error: 'bookings.not_meeting_time' };
    setNow(DEPART - (MEET_BEFORE_MINUTES + 5) * MINUTE);
    for (const step of ['came', 'met', 'no_show'] as const)
      expect(await markMeeting(deps, DRIVER, id, step)).toEqual(early);
    setNow(ENDS);
    expect(await markMeeting(deps, DRIVER, id, 'no_show')).toEqual(early);
  });

  it('«Men keldim» tells the passenger once, with a bot message', async () => {
    const { deps, id, notes, setNow } = await booked();
    setNow(MEETING);
    const first = await markMeeting(deps, DRIVER, id, 'came');
    expect(first.ok && first.value.driverCameAt).toBe(MEETING);
    await markMeeting(deps, DRIVER, id, 'came');
    expect(notes.filter((note) => note.startsWith('passenger: driver came'))).toEqual([
      'passenger: driver came Dilnoza',
    ]);
  });

  it('«Keldi» is marked once and never after «Kelmadi»', async () => {
    const { deps, id, notes, setNow } = await booked();
    setNow(MEETING);
    const met = await markMeeting(deps, DRIVER, id, 'met');
    expect(met.ok && met.value.metAt).toBe(MEETING);
    expect(notes).toContain(`signal ${DILNOZA} passenger`);
    const again = { ok: false, error: 'bookings.already_met' };
    expect(await markMeeting(deps, DRIVER, id, 'met')).toEqual(again);
    expect(await markMeeting(deps, DRIVER, id, 'no_show')).toEqual(again);
  });

  it('«Kelmadi» once files one complaint of the driver and never turns into «Keldi»', async () => {
    const { deps, id, notes, setNow } = await booked();
    setNow(DEPART + HOUR);
    const missed = await markMeeting(deps, DRIVER, id, 'no_show');
    expect(missed.ok && missed.value.noShowAt).toBe(DEPART + HOUR);
    const again = { ok: false, error: 'bookings.already_no_show' };
    expect(await markMeeting(deps, DRIVER, id, 'no_show')).toEqual(again);
    expect(await markMeeting(deps, DRIVER, id, 'met')).toEqual(again);
    expect(await markMeeting(deps, DRIVER, id, 'came')).toEqual(again);
    expect(notes.filter((note) => note.startsWith('complaint'))).toEqual([
      `complaint no_show ${DRIVER} ${id}`,
    ]);
    expect(notes).toContain(`signal ${DILNOZA} passenger`);
  });

  it('the driver sees the marks, the refund and whether the passenger is rated', async () => {
    const { deps, id, setNow } = await booked();
    setNow(MEETING);
    await markMeeting(deps, DRIVER, id, 'no_show');
    const proposed = { state: 'proposed', amount: 9000 } as const;
    const driverDeps = {
      ...deps,
      rated: async () => new Set([id]),
      meeting: { ...deps.meeting, refunds: async () => new Map([[id, proposed.state]]) },
    };
    const [view] = await driverBookings(driverDeps, DRIVER);
    expect(view).toMatchObject({ noShowAt: MEETING, metAt: null, refund: proposed, rated: true });
  });
});
