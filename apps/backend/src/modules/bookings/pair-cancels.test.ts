import { describe, expect, it } from 'vitest';
import { answer, confirm } from './application/answer';
import { cancelEverything } from './application/cancel-all';
import { cancelByPassenger, requestBooking } from './application/request';
import { DILNOZA, DRIVER, seats, setup } from './test-kit';

const idOf = (result: { ok: boolean; value?: { id: string } }) =>
  result.ok && result.value ? result.value.id : '';

// A pair that confirms a seat and cancels it again and again (G45, docs/81 A07, docs/83 N26): the
// third cancel in a month is a line in «Diqqat» of the owner. A cancel of the team rings nothing by
// itself; it is rare and counts with the others.
describe('a pair cancelling again and again', () => {
  it('makes a sign at the third confirmed seat cancelled in a month, a request never counts', async () => {
    const { deps, notes, addTrip, bonus } = setup();
    await bonus();
    const confirmedSeat = async () => {
      const id = idOf(await requestBooking(deps, DILNOZA, addTrip(), seats(1)));
      await confirm(deps, DRIVER, id);
      return id;
    };
    const signs = () => notes.filter((note) => note.startsWith('pair cancels'));
    await cancelByPassenger(deps, DILNOZA, await confirmedSeat());
    // A request cancelled before the answer was never a deal.
    const asked = idOf(await requestBooking(deps, DILNOZA, addTrip(), seats(1)));
    await cancelByPassenger(deps, DILNOZA, asked);
    await answer(deps, DRIVER, await confirmedSeat(), 'driver_cancel', 'team');
    expect(signs()).toEqual([]);
    await answer(deps, DRIVER, await confirmedSeat(), 'driver_cancel');
    expect(signs()).toEqual([`pair cancels: ${DRIVER} ${DILNOZA} 3`]);
  });

  // G89 B20: the seats a block cancels are the team's cancel too, not a step of the pair.
  it('rings nothing when a block of the passenger cancels the third seat', async () => {
    const { deps, notes, addTrip, bonus } = setup();
    await bonus();
    for (let seat = 0; seat < 3; seat += 1) {
      const id = idOf(await requestBooking(deps, DILNOZA, addTrip(), seats(1)));
      await confirm(deps, DRIVER, id);
      if (seat < 2) await cancelByPassenger(deps, DILNOZA, id);
    }
    await cancelEverything(deps, DILNOZA);
    expect(notes.filter((note) => note.startsWith('pair cancels'))).toEqual([]);
  });
});
