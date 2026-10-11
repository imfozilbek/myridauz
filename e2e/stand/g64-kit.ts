import type { BrowserContext } from '@playwright/test';
import { createBookingsClient, createMarketClient } from '@platform/api-client';
import { REQUEST_LINK, type Offer, type RideRequest } from '@platform/contracts';
import { expect, type Page } from '../crash-guard';
import { myBookings } from './g27-kit';
import { shootIn } from './g63-kit';
import { CHILONZOR } from './market-kit';
import { t, type Platform } from './screen-tour';
import { approvedDriver, register } from './seed';
import { openAs, signedAs, type Person } from './stand-kit';
import { standSql } from './stand-tools';

// The tools of G64 on the whole local Rida (docs/118 path 7): the route Chilonzor → Qarshi of this
// goal only, so the boards of the other goals never show its requests.
export const QARSHI = '1710401';
const TO_QARSHI = {
  pickup: { lat: 41.2847, lng: 69.2152 },
  dropoff: { lat: 38.8406, lng: 65.8005 },
} as const;

export type Walk = { readonly platform: Platform; readonly driver: Person; readonly plate: string };
// People of their own: no other scenario of the stand shares their ids, phones or cars.
export const person = (id: number, name: string): Person => ({ id, name, phone: `998901${id}` });

// The driver approved at once and the passengers registered before the walk.
export async function seedWalk(walk: Walk, passengers: readonly Person[]) {
  await approvedDriver(walk.driver, walk.plate);
  for (const passenger of passengers) await register('passenger', passenger, 'female');
}

// The pictures for the owner: screenshots/stand/g64/android-01-board.png with --shots.
export const shoot = shootIn('g64');

// A request of a day; an open one of the same person left by an earlier run is closed first, as the
// rule of one request a day asks (G37, docs/101 R5).
export async function asks(passenger: Person, date: string, wholeCar = false): Promise<RideRequest> {
  standSql(
    `UPDATE ride_requests SET status = 'cancelled' WHERE passenger_id = ${passenger.id} AND status = 'open'`,
  );
  const market = createMarketClient(await signedAs('passenger', passenger));
  const { price } = await market.recommend(CHILONZOR, QARSHI);
  const input = { from: CHILONZOR, to: QARSHI, date, seats: 1, price, pickupMode: 'door' as const };
  return market.publishRequest({ ...input, wholeCar, ...TO_QARSHI });
}

// The card of one passenger on «Yoʻlovchilar soʻrovlari».
export const rowOf = (page: Page, passenger: Person) =>
  page.locator('.request-row', { hasText: passenger.name });

// The live offer of a request, as the passenger's bot button names it (docs/65 B5).
async function offerOf(passenger: Person, requestId: string): Promise<Offer> {
  const offers = await createBookingsClient(await signedAs('passenger', passenger)).myOffers();
  const offer = offers.find((item) => item.requestId === requestId && item.status === 'sent');
  if (!offer) throw new Error(`stand: no offer on the request of ${passenger.name}`);
  return offer;
}

// The chat of the talk, as the bot button «Yangi xabar» or «Qoʻngʻiroq» opens it (G64, docs/07).
export const talkKey = async (driver: Person, request: RideRequest) =>
  createBookingsClient(await signedAs('driver', driver)).openTalk(request.id);

// The second phone: the passenger opens the Mini App by a bot button of this search.
export async function passengerPhone(context: BrowserContext, walk: Walk, who: Person, search: string) {
  const phone = await context.newPage();
  await openAs(phone, 'passenger', who, { platform: walk.platform, search });
  return phone;
}

// «Qabul qilish» or «Rad etish» on the offer of the request the bot button opens.
export async function answerByBot(
  context: BrowserContext,
  walk: Walk,
  who: Person,
  request: RideRequest,
  action: 'accept' | 'decline',
) {
  // The card of the request in the bot opens «Mening soʻrovim» with the offers (G61, G77).
  await offerOf(who, request.id);
  const phone = await passengerPhone(context, walk, who, `?${REQUEST_LINK}=${request.id}`);
  await phone
    .getByRole('button', { name: t(`bookings.offer.${action}`), exact: true })
    .first()
    .click();
  return phone;
}

// Both sides have the booking at once: confirmed for the passenger, on the driver's trip.
export async function booked(passenger: Person, tripId: string) {
  await expect
    .poll(async () => (await myBookings(passenger)).find((seat) => seat.trip.id === tripId)?.status)
    .toBe('confirmed');
}
