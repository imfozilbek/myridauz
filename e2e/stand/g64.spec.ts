import type { BrowserContext } from '@playwright/test';
import { tashkentDate, type RideRequest, type Trip } from '@platform/contracts';
import { expect, test, type Page } from '../crash-guard';
import { pressBack } from '../telegram-mock';
import { seen } from './g63-kit';
import {
  answerByBot,
  asks,
  booked,
  passengerPhone,
  person,
  rowOf,
  seedWalk,
  shoot,
  talkKey,
  QARSHI,
  type Walk,
} from './g64-kit';
import { CHILONZOR, publishTrip } from './market-kit';
import { freshDriver } from './schedule-kit';
import { NARROW, PLATFORMS, t, type Platform } from './screen-tour';
import { openAs, outsideCalls, type Person } from './stand-kit';

// G64 (docs/118 path 7) on the whole local Rida, Android and iOS: the driver offers the own trip from
// the list, in the chat and in the call; the passenger takes it and both have the booking at once.
// The shots go to screenshots/stand/g64/ for the owner (docs/33) with pnpm stand:check --shots.
type Offers = Walk & { readonly list: Person; readonly chat: Person; readonly call: Person };
const WALKS: Record<Platform, Offers> = {
  android: {
    platform: 'android',
    driver: person(900671, 'Shuhrat'),
    plate: '01T671UV',
    list: person(900673, 'Nilufar'),
    chat: person(900675, 'Dilnoza'),
    call: person(900677, 'Malika'),
  },
  ios: {
    platform: 'ios',
    driver: person(900672, 'Jamshid'),
    plate: '01T672UV',
    list: person(900674, 'Zuhra'),
    chat: person(900676, 'Feruza'),
    call: person(900678, 'Kamola'),
  },
};

test.use({ viewport: NARROW });
test.setTimeout(240_000);
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test.beforeAll(async () => {
  for (const walk of Object.values(WALKS)) await seedWalk(walk, [walk.list, walk.chat, walk.call]);
});

// 1. The list: «Safaringizga mos» on top, «Safarimga taklif qilish» with one tap; the passenger
// takes it from the bot button.
async function fromList(context: BrowserContext, page: Page, walk: Offers, trip: Trip, request: RideRequest) {
  await openAs(page, 'driver', walk.driver, { platform: walk.platform });
  await page.getByText(t('common.driver.passengerRequests')).first().click();
  await expect(rowOf(page, walk.list)).toBeVisible();
  await shoot(page, walk, '01-board');
  await rowOf(page, walk.list)
    .getByRole('button', { name: t('requests.action.onTrip') })
    .click();
  await expect(rowOf(page, walk.list).locator('.request-act')).toHaveText(t('bookings.offer.sent.title'));
  await shoot(page, walk, '02-offered');
  const phone = await answerByBot(context, walk, walk.list, request, 'accept');
  await booked(walk.list, trip.id);
  // The page of the booking comes in place of the offer (G61, journey screen 8).
  await expect(phone.getByRole('button', { name: t('bookings.offer.accept'), exact: true })).toHaveCount(0);
  await shoot(phone, walk, '03-accepted');
  await phone.close();
}

// 2. The chat of the request: the same action above the input, the card of the offer for both.
async function inChat(context: BrowserContext, page: Page, walk: Offers, trip: Trip, request: RideRequest) {
  await rowOf(page, walk.chat)
    .getByRole('button', { name: t('chat.open') })
    .click();
  // Above the input: the same action as on the card (mockup g64/5).
  await page.locator('.talk-action', { hasText: t('requests.action.onTrip') }).click();
  await seen(page, t('requests.talk.waiting', { name: walk.chat.name }));
  await shoot(page, walk, '04-chat-offered');
  const phone = await passengerPhone(
    context,
    walk,
    walk.chat,
    `?chat=${await talkKey(walk.driver, request)}`,
  );
  await expect(phone.locator('.talk-accept')).toBeVisible();
  await shoot(phone, walk, '05-chat-offer');
  await phone.locator('.talk-accept').click();
  await booked(walk.chat, trip.id);
  await phone.close();
  await pressBack(page);
}

// 3. The call before a booking: the request and the action on the call screen; the passenger takes
// the offer that came during the call.
async function inCall(context: BrowserContext, page: Page, walk: Offers, trip: Trip, request: RideRequest) {
  await rowOf(page, walk.call)
    .getByRole('button', { name: t('calls.call') })
    .click();
  const offer = page.locator('.call-talk-action', { hasText: t('requests.action.onTrip') });
  await offer.click();
  await expect(offer).toHaveCount(0);
  await shoot(page, walk, '06-call-offered');
  const phone = await passengerPhone(
    context,
    walk,
    walk.call,
    `?chat=${await talkKey(walk.driver, request)}`,
  );
  const accept = phone.locator('.call-talk-action', { hasText: t('requests.talk.accept') });
  await expect(accept).toBeVisible();
  await shoot(phone, walk, '07-call-offer');
  await accept.click();
  await booked(walk.call, trip.id);
  await page.getByRole('button', { name: t('calls.hangUp') }).click();
  await phone.close();
}

for (const platform of PLATFORMS)
  test(`${platform}: the own trip offered from the list, in the chat and in the call`, async ({
    page,
    context,
  }) => {
    const walk = WALKS[platform];
    freshDriver(walk.driver);
    const trip = await publishTrip(walk.driver, CHILONZOR, QARSHI, 'door');
    const day = tashkentDate(trip.departAt);
    const [list, chat, call] = [
      await asks(walk.list, day),
      await asks(walk.chat, day),
      await asks(walk.call, day),
    ];
    await fromList(context, page, walk, trip, list);
    await inChat(context, page, walk, trip, chat);
    await inCall(context, page, walk, trip, call);
  });
