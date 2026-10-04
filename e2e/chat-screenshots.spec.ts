import { expect, test, type Page } from './crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { confirmed } from './bookings-mock';
import { SHARE_TOKEN } from './chat-mock';
import { openOwnTrip } from './market';
import { mockTelegram, telegramUrl } from './telegram-mock';

const { t } = createI18n(DEFAULT_LOCALE);
const [PASSENGER, DRIVER] = MINI_APPS;
const CLOSED_TOKEN = 'closedClosedClosedClosedClosedClosedClosed1';
const shooter = (page: Page, prefix: string) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/${prefix}-${name}.png`, fullPage: true });
};
const open = async (page: Page, url: string) => {
  await mockTelegram(page);
  await page.goto(telegramUrl(url));
};

// More screens of G09 for the owner review (docs/33): both sides of the chat and the edge cases.
test('passenger: Yetib keldim and stop sharing', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/passenger/bookings/*/arrived', (route) =>
    route.fulfill({ json: { ...confirmed, boardedAt: Date.now(), arrivedAt: Date.now() } }),
  );
  const shot = shooter(page, 'trip');
  await open(page, appUrl(PASSENGER.port));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('share.boarded')).click();
  await expect(page.getByText(t('share.arrived'))).toBeVisible();
  await shot('1-on-the-way');
  await page.getByText(t('share.arrived')).click();
  await expect(page.getByText(t('share.told'))).toBeVisible();
  await shot('2-arrived');
  await page.getByText(t('share.stop')).click();
  await expect(page.getByText(t('share.stopped'))).toBeVisible();
  await expect(page.getByText(t('share.stop'))).toBeHidden();
  await shot('3-stopped');
});

test('driver: the chat of a booking', async ({ page }) => {
  const { published, trip } = await mockApi(page, 'active');
  published.push(trip);
  const shot = shooter(page, 'driver-chat');
  await open(page, appUrl(DRIVER.port));
  await page.getByText(t('common.myTrips')).click();
  await openOwnTrip(page);
  await page.getByText('Madina').click();
  await expect(page.getByText(t('chat.open'))).toBeVisible();
  await shot('1-booking');
  await page.getByText(t('chat.open')).click();
  await expect(page.getByText(t('chat.system.confirmed'))).toBeVisible();
  await shot('2-chat');
  await page.getByLabel(t('chat.placeholder')).fill('Telegramda yozing @jasur_driver');
  await page.getByRole('button', { name: t('chat.send') }).click();
  await expect(page.getByText('Telegramda yozing ***')).toBeVisible();
  await shot('3-masked');
});

test('passenger: the chat cannot connect', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/chats/*/ticket', (route) =>
    route.fulfill({ status: 403, json: { error: 'chat.not_member' } }),
  );
  await open(page, appUrl(PASSENGER.port));
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await page.getByText(t('chat.open')).click();
  await expect(page.getByText(t('chat.failed'))).toBeVisible();
  await shooter(page, 'chat')('5-failed');
});

test('close person: five people already follow', async ({ page }) => {
  await mockApi(page, 'unregistered');
  await page.route('**/api/shared/*/follow', (route) =>
    route.fulfill({ status: 409, json: { error: 'shares.too_many' } }),
  );
  await open(page, `${appUrl(PASSENGER.port)}?follow=${SHARE_TOKEN}`);
  await page.getByText(t('share.follow.subscribe')).click();
  await expect(page.getByText(t('share.follow.full'))).toBeVisible();
  await shooter(page, 'follow')('4-full');
});

test('close person: the link is closed', async ({ page }) => {
  await mockApi(page, 'unregistered');
  await page.route(`**/api/shared/${CLOSED_TOKEN}`, (route) =>
    route.fulfill({ status: 404, json: { error: 'shares.not_found' } }),
  );
  await open(page, `${appUrl(PASSENGER.port)}?follow=${CLOSED_TOKEN}`);
  await expect(page.getByText(t('share.follow.closed'))).toBeVisible();
  await shooter(page, 'follow')('5-closed');
});
