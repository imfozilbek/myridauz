import { expect, test } from '../crash-guard';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { confirmedSeat, toldBy, wordsOf } from './g27-kit';
import { openSocket, shot } from './g33-kit';
import { ANVAR, DIYORA, HUMOYUN, LOLA } from './people';
import { openAs } from './stand-kit';
import { botMessages } from './stand-tools';

// G54 (docs/115): a call rings in the open Mini App of the callee, on any screen; the bot calls in only
// a person whose Mini App is closed.
const { t } = createI18n(DEFAULT_LOCALE);
// Longer than the 5 seconds the call waits for the Mini App before the bot (brand.config.ts).
const AFTER_INVITE_MS = 7_000;
const ring = { type: 'call', action: 'ring' };

test('G54. the open Mini App opens the chat and rings by itself; no bot message', async ({ page }) => {
  const { seat } = await confirmedSeat(HUMOYUN, LOLA);
  await openAs(page, 'passenger', LOLA);
  await expect(page.getByText(t('common.myTrips'))).toBeVisible();
  // The personal channel opens with the main screen.
  await page.waitForTimeout(1_000);
  const driver = await openSocket(HUMOYUN, seat.chatKey);
  driver.send(JSON.stringify(ring));
  await expect(page.getByText(t('calls.incoming'))).toBeVisible();
  await shot(page, 'g54-incoming-from-home');
  await page.waitForTimeout(AFTER_INVITE_MS);
  const invited = (await botMessages()).filter(
    (m) => m.chatId === LOLA.id && m.text.includes(wordsOf('bot.call.incoming')),
  );
  expect(invited).toEqual([]);
  driver.send(JSON.stringify({ type: 'call', action: 'end' }));
  driver.close();
});

test('G54. a closed Mini App: the bot calls the person in after 5 seconds', async () => {
  const { seat } = await confirmedSeat(ANVAR, DIYORA);
  const driver = await openSocket(ANVAR, seat.chatKey);
  driver.send(JSON.stringify(ring));
  // Nothing before the 5 seconds: the Mini App may still open the chat.
  await new Promise((resolve) => setTimeout(resolve, 3_000));
  expect(
    (await botMessages()).filter(
      (m) => m.chatId === DIYORA.id && m.text.includes(wordsOf('bot.call.incoming')),
    ),
  ).toEqual([]);
  await new Promise((resolve) => setTimeout(resolve, AFTER_INVITE_MS - 3_000));
  await toldBy('passenger', DIYORA, wordsOf('bot.call.incoming'));
  driver.send(JSON.stringify({ type: 'call', action: 'end' }));
  driver.close();
});
