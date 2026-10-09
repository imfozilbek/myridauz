import { expect, test } from '../crash-guard';
import { loadBrand } from '@platform/brands';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { confirmedSeat, tailOf, toldBy } from './g27-kit';
import { openSocket, shot } from './g33-kit';
import { person } from './g64-kit';
import { ANVAR, DIYORA, LOLA } from './people';
import { approvedDriver } from './seed';
import { openAs } from './stand-kit';
import { botMessages } from './stand-tools';

// G54 (docs/115): a call rings in the open Mini App of the callee, on any screen; the bot calls in only
// a person whose Mini App is closed.
const { t } = createI18n(DEFAULT_LOCALE);
// Longer than the 5 seconds the call waits for the Mini App before the bot (brand.config.ts).
const AFTER_INVITE_MS = 7_000;
const ring = { type: 'call', action: 'ring' };
// The own driver of G54 (lesson 187): a trip of another goal's driver changes the screens of that goal.
const CALLER = person(900654, 'Sarvar');

test.beforeAll(() => approvedDriver(CALLER, '01T654UV'));

// G68 (docs/155): the call rises as a sheet over the open Mini App first; the test keeps the sheet.
test.describe('the open Mini App', () => {
  test.use({ actionSheets: 'keep' });
  test('G54, G68. the open Mini App rings with the sheet of the call; no bot message', async ({ page }) => {
    const { seat } = await confirmedSeat(CALLER, LOLA);
    await openAs(page, 'passenger', LOLA);
    await expect(page.getByText(t('common.myTrips'))).toBeVisible();
    // The personal channel opens with the main screen.
    await page.waitForTimeout(1_000);
    const driver = await openSocket(CALLER, seat.chatKey);
    driver.send(JSON.stringify(ring));
    await expect(page.getByText(t('sheet.call.kicker', { brand: loadBrand().name }))).toBeVisible();
    await shot(page, 'g54-incoming-from-home');
    await page.waitForTimeout(AFTER_INVITE_MS);
    const invited = (await botMessages()).filter(
      (m) => m.chatId === LOLA.id && m.text.includes(tailOf('bot.ring.call')),
    );
    expect(invited).toEqual([]);
    driver.send(JSON.stringify({ type: 'call', action: 'end' }));
    driver.close();
  });
});

test('G54. a closed Mini App: the bot calls the person in after 5 seconds', async () => {
  const { seat } = await confirmedSeat(ANVAR, DIYORA);
  const driver = await openSocket(ANVAR, seat.chatKey);
  driver.send(JSON.stringify(ring));
  // Nothing before the 5 seconds: the Mini App may still open the chat.
  await new Promise((resolve) => setTimeout(resolve, 3_000));
  expect(
    (await botMessages()).filter((m) => m.chatId === DIYORA.id && m.text.includes(tailOf('bot.ring.call'))),
  ).toEqual([]);
  await new Promise((resolve) => setTimeout(resolve, AFTER_INVITE_MS - 3_000));
  await toldBy('passenger', DIYORA, tailOf('bot.ring.call'));
  driver.send(JSON.stringify({ type: 'call', action: 'end' }));
  driver.close();
});
