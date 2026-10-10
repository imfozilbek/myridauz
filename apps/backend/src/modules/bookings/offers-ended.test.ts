import { describe, expect, it } from 'vitest';
import { acceptOffer } from './application/accept';
import { endOffers } from './application/offers-ended';
import { sendOffer } from './application/offers';
import type { OfferRecord } from './domain/offer';
import { DILNOZA, DRIVER, HOUR, NOW, setup } from './test-kit';

const ON_THE_DAY = NOW + 26 * HOUR;
const offer = { departAt: ON_THE_DAY, price: 95_000 };
const OTHER_DRIVER = 777;
const waiting = (requestId: string): OfferRecord => ({
  id: 'other',
  requestId,
  driverId: OTHER_DRIVER,
  departAt: ON_THE_DAY,
  price: 90_000,
  seats: null,
  car: null,
  status: 'sent',
  bookingId: null,
  talkId: null,
  tripId: null,
  createdAt: NOW,
});
const ended = (notes: readonly string[]) => notes.filter((note) => note.startsWith('offer expired'));

// A request closed while drivers wait for the answer (G75, docs/158 Й): each of them hears once that
// the offer is over, and the offer is over for good.
describe('the offers left on a closed request', () => {
  it('end when the passenger takes another offer', async () => {
    const { deps, addRequest, bonus, notes } = setup();
    await bonus();
    const requestId = addRequest();
    await deps.offers.save(waiting(requestId));
    const sent = await sendOffer(deps, DRIVER, requestId, offer);
    await acceptOffer(deps, DILNOZA, sent.ok ? sent.value.id : '');
    expect(ended(notes)).toEqual([`offer expired: ${OTHER_DRIVER}`]);
    expect((await deps.offers.find('other'))?.status).toBe('expired');
  });

  it('end once when the request is cancelled or its day is over', async () => {
    const { deps, addRequest, bonus, notes, close } = setup();
    await bonus();
    const requestId = addRequest();
    await sendOffer(deps, DRIVER, requestId, offer);
    close(requestId);
    await endOffers(deps, requestId);
    await endOffers(deps, requestId);
    expect(ended(notes)).toEqual([`offer expired: ${DRIVER}`]);
  });
});
