import { MINUTE_MS } from '@platform/contracts';
import { describe, expect, it } from 'vitest';
import { driverBookings } from './application/answer';
import { markMeeting } from './application/meeting';
import { requestBooking } from './application/request';
import { booked, DEPART, ENDS, MEET_MINUTES, MEETING } from './test-booked';
import { ALI, DILNOZA, DRIVER, HOUR, OLIM, seats, setup } from './test-kit';

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

  it("opens the brand's minutes before the departure and closes with the trip", async () => {
    const { deps, id, setNow } = await booked();
    const early = { ok: false, error: 'bookings.not_meeting_time' };
    setNow(DEPART - (MEET_MINUTES + 5) * MINUTE_MS);
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
    // «Keldi» is the passenger in the car: the close people hear it once (G76, docs/43).
    expect(met.ok && met.value.boardedAt).toBe(MEETING);
    expect(notes.filter((note) => note === 'close ones: Dilnoza boarded')).toHaveLength(1);
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
    // The trip card of the passenger says it at once (G68).
    expect(notes).toContain('passenger: no show Dilnoza');
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

  it('asks the complaints for the refunds of the no-shows only, and not at all without one', async () => {
    const { deps, id, setNow, addTrip } = await booked();
    // Ali asked for a seat on another trip of the driver and comes into no refund.
    await requestBooking(deps, ALI, addTrip(), seats(1));
    const asked: string[][] = [];
    const counting = {
      ...deps,
      meeting: {
        ...deps.meeting,
        refunds: async (_driver: number, ids: readonly string[]) => {
          asked.push([...ids]);
          return new Map();
        },
      },
    };
    await driverBookings(counting, DRIVER);
    setNow(MEETING);
    await markMeeting(deps, DRIVER, id, 'no_show');
    await driverBookings(counting, DRIVER);
    expect(asked).toEqual([[id]]);
  });
});
