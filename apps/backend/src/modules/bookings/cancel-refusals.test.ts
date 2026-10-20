import { describe, expect, it } from 'vitest';
import { cancelByPassenger } from './application/request';
import { booked } from './test-booked';
import { ALI, DILNOZA } from './test-kit';

const refused = (error: string) => ({ ok: false, error });

// G89: a passenger cancels only an own seat of a trip that is there; an answer of the driver in the
// same moment wins, and no commission goes back twice.
describe('a cancel of a passenger refused', () => {
  it('cancels no seat of nobody, of another person or of a trip that is gone', async () => {
    const { deps, id } = await booked();
    expect(await cancelByPassenger(deps, DILNOZA, 'none')).toEqual(refused('bookings.not_found'));
    expect(await cancelByPassenger(deps, ALI, id)).toEqual(refused('bookings.not_found'));
    const gone = { ...deps, trips: { ...deps.trips, find: async () => undefined } };
    expect(await cancelByPassenger(gone, DILNOZA, id)).toEqual(refused('bookings.not_found'));
  });

  it('says the seat changed when the driver answered first', async () => {
    const { deps, id, notes } = await booked();
    const racing = { ...deps, bookings: { ...deps.bookings, replace: async () => false } };
    expect(await cancelByPassenger(racing, DILNOZA, id)).toEqual(refused('bookings.wrong_status'));
    expect(notes.filter((note) => note.includes('cancelled'))).toEqual([]);
  });
});
