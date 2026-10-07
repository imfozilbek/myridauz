import { BOOKING_LINK } from '@platform/contracts';
import { createI18n, DEFAULT_LOCALE } from '@platform/i18n';
import { createModerationClient } from '@platform/api-client';
import type { Page } from '@playwright/test';
import { expect, test } from '../crash-guard';
import { confirmedSeat, MINUTE, moveTrip } from './g27-kit';
import { phone } from './g33-kit';
import { OWNER } from './people';
import { PLATFORMS } from './screen-tour';
import { apply, register } from './seed';
import { openAs, outsideCalls, signedAs, type Person } from './stand-kit';
import { runCron, standSql } from './stand-tools';

// G60 (docs/118 path 3, docs/129) on the whole local Rida, Android and iOS: the booking, its chat,
// the past trip and the review. The shots go to screenshots/stand/g60/ for the owner (docs/33).
const { t } = createI18n(DEFAULT_LOCALE);
const HOUR = 60 * MINUTE;
const DRIVER: Person = { id: 900606, name: 'Jasur', phone: '998901110606' };
const PASSENGERS = {
  android: { id: 900607, name: 'Madina', phone: '998901110607' },
  ios: { id: 900608, name: 'Dilnoza', phone: '998901110608' },
} as const;
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `screenshots/stand/g60/${name}.png`, animations: 'disabled' });

test.setTimeout(180_000);
test.afterEach(() => expect(outsideCalls()).toEqual([]));

test.beforeAll(async () => {
  await apply(DRIVER, '01S678TU', 'male');
  for (const passenger of Object.values(PASSENGERS)) await register('passenger', passenger, 'female');
  const moderation = createModerationClient(await signedAs('admin', OWNER));
  const summary = (await moderation.queue()).find((a) => a.firstName === DRIVER.name);
  if (summary) await moderation.decide(summary.userId, { action: 'approve' });
  await runCron();
});

test('the booking, its chat, the past trip and the review (mockups g60)', async ({ browser }) => {
  for (const platform of PLATFORMS) {
    const passenger = PASSENGERS[platform];
    const { trip, seat } = await confirmedSeat(DRIVER, passenger);
    const page = await phone(browser);
    const search = `?${BOOKING_LINK}=${seat.id}`;
    await openAs(page, 'passenger', passenger, { platform, search });
    await expect(page.getByText(t('bookings.toClose'))).toBeVisible();
    await shot(page, `1-booking-${platform}`);
    await page.getByText(t('chat.open')).click();
    await expect(page.getByRole('button', { name: t('calls.call') })).toBeVisible();
    await shot(page, `2-chat-${platform}`);
    // The trip ended an hour ago (docs/129): the chat and the call stay 24 hours, the stars 7 days.
    moveTrip(trip.id, Date.now() - 6 * HOUR, Date.now() - HOUR);
    standSql(`UPDATE bookings SET status = 'completed' WHERE id = '${seat.id}'`);
    // A new phone: the app keeps the last screen (G33), and the chat was open.
    await page.context().close();
    const later = await phone(browser);
    await openAs(later, 'passenger', passenger, { platform, search });
    await expect(later.getByText(t('bookings.done.title'))).toBeVisible();
    await shot(later, `3-past-trip-${platform}`);
    await later.getByText(t('bookings.done.rate')).click();
    await expect(later.getByLabel('5', { exact: true })).toBeVisible();
    await shot(later, `4-review-${platform}`);
    await later.context().close();
  }
});
