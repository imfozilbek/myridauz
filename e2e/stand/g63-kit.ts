import type { BrowserContext } from '@playwright/test';
import { createMarketClient } from '@platform/api-client';
import { commissionFor, loadBrand } from '@platform/brands';
import { TRIP_LINK, type Trip } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, type Page } from '../crash-guard';
import { newTripTile, TEXT } from '../apps';
import { chooseRoute } from '../market';
import { SAMARQAND, walletOf } from './g27-kit';
import { CHILONZOR } from './market-kit';
import { fillEnds } from './request-kit';
import { mainButton, type Platform } from './screen-tour';
import { CAR } from './seed';
import { openAs, signedAs, type Person } from './stand-kit';

// The tools and the first two steps of the driver path of G63 (docs/143) on the whole local Rida:
// each step taps the screens as a person does and reads the state of the server on them.
const { t, formatNumber } = createI18n(DEFAULT_LOCALE);
const BRAND = loadBrand();
// The passenger asks two seats: the commission of the card counts both (docs/12).
export const SEATS = 2;
// The row of the day and time on the one screen: today or tomorrow, the first free day (docs/103).
const DAY_ROW = new RegExp(`^(${t('market.day.today')}|${t('market.day.tomorrow')}), `, 'u');

export type Walk = { readonly platform: Platform; readonly driver: Person; readonly passenger: Person };

// A picture of the screen only with --shots (e2e/crash-guard.ts), as g63/android-01-publish.png.
export const shootIn =
  (goal: string) =>
  async (page: Page, { platform }: { readonly platform: Platform }, name: string) => {
    // The data and the small maps are drawn first: the picture shows the screen people see.
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-busy="true"], [data-state="loading"]')).toHaveCount(0);
    await page.screenshot({
      path: `screenshots/stand/${goal}/${platform}-${name}.png`,
      animations: 'disabled',
    });
  };
export const shoot = shootIn('g63');
export const seen = (page: Page, text: string) =>
  expect(page.getByText(text, { exact: true }).first()).toBeVisible();
const more = (page: Page) => page.getByRole('button', { name: t('market.price.more') });
// The main button of Telegram once it says this: the screen behind it is ready.
export const press = (page: Page, text: string) => mainButton(page).filter({ hasText: text }).click();
export const commissionOf = (trip: Trip) => formatNumber(commissionFor(BRAND.commission, trip.price, SEATS));
// «Qoldi ≈ N joyga yetadi»: the seats of this price the wallet of the driver still confirms (docs/12).
export async function seatsLeft(driver: Person, trip: Trip) {
  const { bonus, main } = await walletOf(driver);
  return String(Math.floor((bonus + main) / commissionFor(BRAND.commission, trip.price, 1)));
}

// 1. «Safar eʼlon qilish» on one screen (docs/143 §1): every seat of the car, «Qayerdan olasiz?»,
// tomorrow, the price one step up; «Mening safarim» of the new trip at once, with the plate of the
// stage and the card of the channel.
export async function publishOnOneScreen(page: Page, walk: Walk): Promise<Trip> {
  const market = createMarketClient(await signedAs('driver', walk.driver));
  const { price, roundStep } = await market.recommend(CHILONZOR, SAMARQAND);
  await openAs(page, 'driver', walk.driver, { platform: walk.platform });
  await newTripTile(page).click();
  await chooseRoute(page);
  await expect(mainButton(page)).toHaveText(TEXT.publish);
  // Every seat of the car: no «+» above them, so no «Mashinada ayol bor» (docs/06).
  await seen(page, t('market.publish.carSeats', { count: String(CAR.seats) }));
  await expect(more(page).first()).toBeDisabled();
  await expect(page.getByText(t('market.search.woman'))).toHaveCount(0);
  // The pitak and the doors: the system takes the pitak of the direction, its card opens the map.
  await page.getByText(t('way.trip.mode.both')).click();
  await seen(page, t('way.trip.onMap'));
  // Tomorrow morning: the trip waits for people until the clock of the stand moves (step 3).
  await page.getByText(DAY_ROW).first().click();
  await page.getByText(t('market.day.tomorrow'), { exact: true }).click();
  await mainButton(page).click();
  const time = BRAND.schedule.defaultTime;
  await seen(page, t('market.publish.day', { date: t('market.day.tomorrow'), time }));
  const raised = price + roundStep;
  await more(page).last().click();
  const commission = formatNumber(commissionFor(BRAND.commission, raised, 1));
  await seen(page, t('market.publish.price', { price: formatNumber(price), commission }));
  await shoot(page, walk, '01-publish');
  await mainButton(page).click();
  await seen(page, t('driverTrip.published.title'));
  await seen(page, t('driverTrip.channel.share'));
  await seen(page, t('driverTrip.free', { count: String(CAR.seats), price: formatNumber(raised) }));
  const [trip] = (await market.myTrips()).filter((item) => item.status === 'active');
  if (!trip?.pitak) throw new Error('stand: the trip of G63 is not out from the pitak');
  await seen(page, trip.pitak.name);
  await shoot(page, walk, '02-my-trip');
  return trip;
}

// 2. A passenger books two seats on a second phone; the open «Mening safarim» gets the request by
// itself (docs/64): «Joy soʻraganlar» with the commission in the card, «Tasdiqlash» at once.
export async function bookAndConfirm(context: BrowserContext, page: Page, walk: Walk, trip: Trip) {
  const second = await context.newPage();
  const search = `?${TRIP_LINK}=${trip.id}`;
  await openAs(second, 'passenger', walk.passenger, { platform: walk.platform, search });
  await more(second).click();
  await press(second, t('find.book', { count: String(SEATS) }));
  await fillEnds(second);
  await seen(second, t('bookings.points.all'));
  await mainButton(second).click();
  await seen(second, t('bookings.status.requested'));
  await shoot(second, walk, '03-seats-asked');
  await second.close();
  await seen(page, t('driverTrip.asked', { count: '1' }));
  await seen(page, t('driverTrip.commission', { amount: commissionOf(trip) }));
  await shoot(page, walk, '04-asked');
  await page.getByRole('button', { name: t('bookings.confirm'), exact: true }).click();
  await seen(page, t('driverTrip.passengers', { count: String(SEATS) }));
  await shoot(page, walk, '05-confirmed');
}
