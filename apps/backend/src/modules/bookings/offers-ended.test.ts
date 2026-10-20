import { describe, expect, it } from 'vitest';
import { acceptOffer } from './application/accept';
import { cancelEverything } from './application/cancel-all';
import { endOffers } from './application/offers-ended';
import { sendOffer } from './application/offers';
import { offerSalonTrip } from './application/salon-trip';
import { cancelTripByTeam } from './application/team-cancel';
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

// G89 T6, B21: an offer the driver's trip ended is over for the passenger too: the card of the request
// counts the offers left and the open Mini App follows.
describe('the offers ended by the trip of their driver', () => {
  const told = (notes: readonly string[]) => notes.filter((note) => note.startsWith('request card'));

  it('reach the passenger when the team cancels the trip of the offer', async () => {
    const { deps, addTrip, addRequest, bonus, notes } = setup();
    await bonus();
    const tripId = addTrip({ departAt: ON_THE_DAY });
    const requestId = addRequest();
    const sent = await sendOffer(deps, DRIVER, requestId, { departAt: 0, price: 1, tripId });
    await cancelTripByTeam(deps, tripId, 'Yoʻl yopiq');
    expect((await deps.offers.find(sent.ok ? sent.value.id : ''))?.status).toBe('expired');
    expect(told(notes)).toEqual([`request card: ${requestId}`]);
    expect(ended(notes)).toEqual([]);
  });

  it('reach the passenger when the driver is blocked', async () => {
    const { deps, addRequest, bonus, notes } = setup();
    await bonus();
    const requestId = addRequest();
    await sendOffer(deps, DRIVER, requestId, offer);
    await cancelEverything(deps, DRIVER);
    expect(told(notes)).toEqual([`request card: ${requestId}`]);
  });

  it('reach the passenger and the driver when the driver opened another trip', async () => {
    const { deps, addRequest, bonus, notes } = setup();
    await bonus();
    const requestId = addRequest();
    await sendOffer(deps, DRIVER, requestId, offer);
    await offerSalonTrip(deps, DRIVER, addRequest({ wholeCar: true }), ON_THE_DAY);
    expect(told(notes)).toEqual([`request card: ${requestId}`]);
    expect(ended(notes)).toEqual([`offer expired: ${DRIVER}`]);
  });
});
