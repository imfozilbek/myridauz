import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { chatSocket } from './chat-mock';
import { expect, test, type Page } from './crash-guard';
import { openDriverTalk, type Talk } from './g64-talk-mock';
import { openPassengerTalk } from './g64-talk-passenger';

// Pixel Perfect of the talk before a booking (G64, lessons 141, 147): the phones of g64/5 and the
// call of g64/2 phone 2 at the size and scale of the mockup (360 × 760 at 1.5), the data of the
// mockup; the diff is read by scripts/pixel-diff.py.
const { t } = createI18n(DEFAULT_LOCALE);
const OUT = 'screenshots/pixel-g64';
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1.5 });

const shot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}-code.png`, animations: 'disabled' });

const CHATS: readonly (readonly [string, Talk])[] = [
  ['5-chat-1', 'trip'],
  ['5-chat-2', 'salon'],
  ['5-chat-3', 'sent'],
];

for (const [name, talk] of CHATS)
  test(`${name}: the chat of the driver`, async ({ page }) => {
    await openDriverTalk(page, talk);
    await shot(page, name);
  });

test('2-call-2: the driver offers during the call', async ({ page }) => {
  await openDriverTalk(page, 'call');
  chatSocket.current?.send(JSON.stringify({ type: 'call', call: { status: 'active', caller: 'me' } }));
  await expect(page.getByText(t('requests.action.onTrip')).last()).toBeVisible();
  // «01:12» of the mockup: the talk started at 12:20:00.
  await expect(page.getByText('00:00')).toBeVisible();
  await page.clock.setFixedTime(Date.parse('2026-10-06T12:21:12+05:00'));
  await expect(page.getByText('01:12')).toBeVisible();
  await shot(page, '2-call-2');
});

test('4-accept-1: the chat of the passenger with the offer', async ({ page }) => {
  await openPassengerTalk(page);
  await shot(page, '4-accept-1');
});

test('4-accept-2: the offer came during the call', async ({ page }) => {
  await openPassengerTalk(page, true);
  chatSocket.current?.send(JSON.stringify({ type: 'call', call: { status: 'active', caller: 'other' } }));
  await expect(page.getByText('00:00')).toBeVisible();
  await page.clock.setFixedTime(Date.parse('2026-10-06T12:22:40+05:00'));
  await expect(page.getByText('02:40')).toBeVisible();
  await shot(page, '4-accept-2');
});
