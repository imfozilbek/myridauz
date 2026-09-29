import { test, type Page } from '@playwright/test';
import { mockApi } from './api-mock';
import { appUrl, MINI_APPS } from './apps';
import { mockBookings } from './bookings-mock';
import { bookSeats, confirmBooking, openWallet, passengerTrips, teamWallets } from './bookings';
import { followTrip, passengerChat } from './chat';
import { SHARE_TOKEN } from './chat-mock';
import { mockTelegram, telegramUrl } from './telegram-mock';

const [PASSENGER, DRIVER, ADMIN] = MINI_APPS;
const shooter = (page: Page, prefix: string) => async (name: string) => {
  await page.mouse.move(0, 0);
  await page.screenshot({ path: `screenshots/${prefix}-${name}.png`, fullPage: true });
};
const open = async (page: Page, port: number) => {
  await mockTelegram(page);
  await page.goto(telegramUrl(appUrl(port)));
};

// Screenshots for the owner review (docs/33): bookings, the confirmation, "Hamyon" (G08).
test('passenger: books seats', async ({ page }) => {
  await mockApi(page, 'active');
  await open(page, PASSENGER.port);
  await bookSeats(page, shooter(page, 'booking-new'));
});

test('passenger: Mening safarlarim with a seat and an offer', async ({ page }) => {
  await mockApi(page, 'active');
  await open(page, PASSENGER.port);
  await passengerTrips(page, shooter(page, 'booking-mine'));
});

test('driver: confirms a booking', async ({ page }) => {
  const { published, trip } = await mockApi(page, 'active');
  published.push(trip);
  await open(page, DRIVER.port);
  await confirmBooking(page, shooter(page, 'booking-confirm'));
});

test('driver: no money for the commission', async ({ page }) => {
  const { published, trip } = await mockApi(page, 'active');
  await mockBookings(page, false);
  published.push(trip);
  await open(page, DRIVER.port);
  await confirmBooking(page, shooter(page, 'booking-no-money'), false);
});

test('driver: Hamyon', async ({ page }) => {
  await mockApi(page, 'active');
  await open(page, DRIVER.port);
  await openWallet(page, shooter(page, 'wallet'));
});

test('admin: Hamyonlar', async ({ page }) => {
  await mockApi(page, 'active');
  await open(page, ADMIN.port);
  await teamWallets(page, shooter(page, 'team-wallets'));
});

test('passenger: chat, hidden phone, Mashinaga chiqdim', async ({ page }) => {
  await mockApi(page, 'active');
  await open(page, PASSENGER.port);
  await passengerChat(page, shooter(page, 'chat'));
});

test('close person: follows a shared trip', async ({ page }) => {
  await mockApi(page, 'unregistered');
  await mockTelegram(page);
  await page.goto(telegramUrl(`${appUrl(PASSENGER.port)}?follow=${SHARE_TOKEN}`));
  await followTrip(page, shooter(page, 'follow'));
});
