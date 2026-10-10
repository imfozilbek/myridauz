import { describe, expect, it } from 'vitest';
import { answer } from './application/answer';
import { markMeeting } from './application/meeting';
import { markProgress } from './application/progress';
import { cancelByPassenger } from './application/request';
import { ratableRideOf } from './application/rides';
import { booked, MEETING } from './test-booked';
import { DILNOZA, DRIVER } from './test-kit';

const REFUSED = { ok: false, error: 'bookings.wrong_status' };

describe('the marks of the meeting hold (docs/35, docs/65 A4, G63)', () => {
  it('after «Keldi» or «Kelmadi» nobody cancels: never a refund by a tap', async () => {
    for (const step of ['met', 'no_show'] as const) {
      const { deps, id, setNow, wallet } = await booked();
      setNow(MEETING);
      await markMeeting(deps, DRIVER, id, step);
      expect(await cancelByPassenger(deps, DILNOZA, id)).toEqual(REFUSED);
      expect(await answer(deps, DRIVER, id, 'driver_cancel')).toEqual(REFUSED);
      expect((await deps.bookings.find(id))?.status).toBe('confirmed');
      expect((await wallet()).some((operation) => operation.kind === 'refund')).toBe(false);
    }
  });

  it('«Kelmadi» is refused once the passenger said «Yetib keldim»; the ride stays to rate', async () => {
    const { deps, id, notes, setNow } = await booked();
    setNow(MEETING);
    await markProgress(deps, DILNOZA, id, 'arrived');
    expect(await markMeeting(deps, DRIVER, id, 'no_show')).toEqual(REFUSED);
    expect(notes.some((note) => note.startsWith('complaint'))).toBe(false);
    expect((await ratableRideOf(deps, id))?.bookingId).toBe(id);
  });

  it('«Keldi» and «Kelmadi» at the same moment: one wins, at most one complaint', async () => {
    const { deps, id, notes, setNow } = await booked();
    setNow(MEETING);
    const taps = await Promise.all([
      markMeeting(deps, DRIVER, id, 'met'),
      markMeeting(deps, DRIVER, id, 'no_show'),
      markMeeting(deps, DRIVER, id, 'no_show'),
    ]);
    expect(taps.filter((tap) => tap.ok)).toHaveLength(1);
    expect(taps.filter((tap) => !tap.ok).map((tap) => !tap.ok && tap.error)).toEqual([
      'bookings.already_met',
      'bookings.already_met',
    ]);
    const record = await deps.bookings.find(id);
    expect([record?.metAt, record?.noShowAt]).toEqual([MEETING, null]);
    expect(notes.some((note) => note.startsWith('complaint'))).toBe(false);
  });

  it('two «Men keldim» at once tell the passenger once', async () => {
    const { deps, id, notes, setNow } = await booked();
    setNow(MEETING);
    const taps = await Promise.all([
      markMeeting(deps, DRIVER, id, 'came'),
      markMeeting(deps, DRIVER, id, 'came'),
    ]);
    expect(taps.every((tap) => tap.ok && tap.value.driverCameAt === MEETING)).toBe(true);
    expect(notes.filter((note) => note.startsWith('passenger: driver came'))).toHaveLength(1);
  });

  it('a cancel that came first stays: a late mark never brings the booking back', async () => {
    const { deps, id, notes, setNow } = await booked();
    setNow(MEETING);
    const [, came] = await Promise.all([
      cancelByPassenger(deps, DILNOZA, id),
      markMeeting(deps, DRIVER, id, 'came'),
    ]);
    expect(came).toEqual(REFUSED);
    expect((await deps.bookings.find(id))?.status).toBe('cancelled_by_passenger');
    expect(notes.some((note) => note.startsWith('passenger: driver came'))).toBe(false);
  });
});
