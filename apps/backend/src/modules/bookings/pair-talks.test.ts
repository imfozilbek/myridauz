import { describe, expect, it } from 'vitest';
import { acceptOffer } from './application/accept';
import { sendOffer } from './application/offers';
import { openTalk } from './application/talks';
import { DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

const offer = { departAt: NOW + 26 * HOUR, price: 95_000 };
const pairs = (notes: readonly string[]) => notes.filter((note) => note.startsWith('pair:'));

// The same driver and passenger talked about requests 3 times and never booked: maybe a deal past
// Rida, a sign for «Diqqat» of the owner (docs/129 rule 5, G75).
describe('a pair that talks and never books', () => {
  it('tells the owner at the third talk without a booking, not before', async () => {
    const { deps, addRequest, notes } = setup();
    await openTalk(deps, DRIVER, addRequest());
    await openTalk(deps, DRIVER, addRequest());
    expect(pairs(notes)).toEqual([]);
    const third = addRequest();
    await openTalk(deps, DRIVER, third);
    await openTalk(deps, DRIVER, third);
    expect(pairs(notes)).toEqual([`pair: ${DRIVER} ${DILNOZA} 3`]);
  });

  it('counts no talk that became a booking', async () => {
    const { deps, addRequest, bonus, notes } = setup();
    await bonus();
    const booked = addRequest();
    const sent = await sendOffer(deps, DRIVER, booked, offer);
    await acceptOffer(deps, DILNOZA, sent.ok ? sent.value.id : '');
    await openTalk(deps, DRIVER, addRequest());
    await openTalk(deps, DRIVER, addRequest());
    expect(pairs(notes)).toEqual([]);
  });
});
