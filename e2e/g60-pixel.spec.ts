import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { expect, test } from './crash-guard';
import { mockApi } from './api-mock';
import { FAKE_MEDIA } from './call-mock';
import { chatSocket, SHARE_TOKEN } from './chat-mock';
import { mockupBooking, mockupChat, mockupShared, openAt, shot, tashkent } from './g60-pixel-mock';

// Pixel Perfect of G60 (lessons 141, 147, 151): each screen at the size of its phone in the mockup
// (docs/goals/g60/*.png, 360 wide) with the data of the mockup; scripts/pixel-diff.py reads the diff.
const { t } = createI18n(DEFAULT_LOCALE);
test.use({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1 });

const tomorrow = mockupBooking(tashkent('2026-10-07T16:00'));

test('the booking page, the chat and the call (mockups g60/1, g60/2, g60/4)', async ({ page }) => {
  await mockApi(page, 'active');
  await page.route('**/api/chats/*/about', (route) =>
    route.fulfill({ json: { booking: tomorrow, role: 'passenger' } }),
  );
  await page.addInitScript(FAKE_MEDIA);
  await mockupChat(page, [
    { author: 'system', text: 'confirmed', at: tashkent('2026-10-06T13:55') },
    {
      author: 'other',
      text: 'Assalomu alaykum! Bozor darvozasi oldida kutaman.',
      at: tashkent('2026-10-06T14:09'),
    },
    { author: 'me', text: 'Vaalaykum assalom! Kelaman.', at: tashkent('2026-10-06T14:14') },
  ]);
  await openAt(page, '2026-10-06T14:20', [tomorrow]);
  await page.getByText(t('common.myTrips')).click();
  await page.getByText('Jasur').first().click();
  await expect(page.getByText(t('bookings.toClose'))).toBeVisible();
  await shot(page, '1-1');
  await page.getByText(t('chat.open')).click();
  await expect(page.getByText('Vaalaykum assalom! Kelaman.')).toBeVisible();
  await shot(page, '2-1');
  chatSocket.current?.send(JSON.stringify({ type: 'call', call: { status: 'ringing', caller: 'other' } }));
  await expect(page.getByText(t('calls.incoming'))).toBeVisible();
  await shot(page, '4-2');
  await page.getByText(t('calls.answer')).click();
  await expect(page.getByText('00:00')).toBeVisible();
  await page.clock.setFixedTime(tashkent('2026-10-06T14:22:14'));
  await expect(page.getByText('02:14')).toBeVisible();
  await page.mouse.move(0, 0);
  await shot(page, '4-1');
});

test('the screen of the close people on the way (mockup g60/3)', async ({ page }) => {
  await mockApi(page, 'active');
  const shared = mockupShared(tashkent('2026-10-05T22:22'), 'on_the_way');
  await page.route(`**/api/shared/${SHARE_TOKEN}`, (route) => route.fulfill({ json: shared }));
  await openAt(page, '2026-10-06T00:30', [], `?follow=${SHARE_TOKEN}`);
  await expect(page.getByText(t('share.follow.subscribe'))).toBeVisible();
  await shot(page, '3-1');
});
