import { createMarketClient } from '@platform/api-client';
import type { Page } from '@playwright/test';
import { expect, test } from '../crash-guard';
import { showChat } from './bot-chat';
import { press } from './bot-kit';
import { MINUTE, moveTrip, SAMARQAND, TO_SAMARQAND } from './g27-kit';
import { book, CHILONZOR, publishTrip } from './market-kit';
import { AZIZA, ULUGBEK } from './people';
import { signedAs, type Person } from './stand-kit';
import { botMessages, clearBotMessages } from './stand-tools';

// One trip in the passenger bot and the driver bot as people see them (G68, docs/122, docs/152):
// from the request to the end, the chats drawn after each step for the owner.
const HOUR = 60 * MINUTE;

async function shoot(page: Page, bot: 'passenger' | 'driver', person: Person, name: string) {
  const mine = (await botMessages()).filter((message) => message.bot === bot && message.chatId === person.id);
  await showChat(page, bot, mine);
  await page.screenshot({ path: `screenshots/stand/g68/${name}.png`, fullPage: true });
  return mine;
}

test('G68. the cards of one trip live in both bots, from the request to the end', async ({ page }) => {
  await clearBotMessages();
  const trip = await publishTrip(ULUGBEK, CHILONZOR, SAMARQAND, 'door');
  const booking = await book(AZIZA, trip, { seats: 1, mode: 'door', ...TO_SAMARQAND });
  const asked = await shoot(page, 'driver', ULUGBEK, '1-driver-request');
  const ask = asked.find((message) => message.replyTo !== null && message.method === 'sendMessage');
  expect(ask?.buttons.length).toBeGreaterThanOrEqual(2);
  await press('driver', ULUGBEK, `ask:${booking.id}:yes`, ask?.messageId ?? 1);
  await shoot(page, 'driver', ULUGBEK, '2-driver-accepted');
  const confirmed = await shoot(page, 'passenger', AZIZA, '3-passenger-confirmed');
  expect(confirmed.some((message) => message.replyTo !== null)).toBe(true);

  moveTrip(trip.id, Date.now() + 10 * MINUTE, Date.now() + 6 * HOUR);
  const market = createMarketClient(await signedAs('driver', ULUGBEK));
  await market.departTrip(trip.id);
  await shoot(page, 'passenger', AZIZA, '4-passenger-on-the-way');
  await shoot(page, 'driver', ULUGBEK, '5-driver-on-the-way');
  await market.arriveTrip(trip.id);
  await shoot(page, 'passenger', AZIZA, '6-passenger-arrived');
  await shoot(page, 'driver', ULUGBEK, '7-driver-arrived');
});
